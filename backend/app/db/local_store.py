from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.core.config import Settings
from app.core.exceptions import AuthenticationError
from app.models.schemas import AuthCredentials, AuthUser


JSON_COLUMNS = {"metadata", "options", "practice_artifact"}


class LocalAppStore:
    def __init__(self, settings: Settings) -> None:
        self.path = Path(settings.local_database_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        conn.execute("pragma foreign_keys = on")
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                create table if not exists media_users (
                  id text primary key,
                  email text not null unique,
                  password_hash text not null,
                  password_salt text not null,
                  full_name text,
                  carnet text,
                  university text,
                  role text,
                  specialty text,
                  academic_level text,
                  learning_challenges text,
                  created_at text not null,
                  updated_at text not null
                );

                create table if not exists media_sessions (
                  access_token text primary key,
                  refresh_token text not null unique,
                  user_id text not null references media_users(id) on delete cascade,
                  expires_at text not null,
                  created_at text not null
                );

                create table if not exists user_learning_profiles (
                  user_id text primary key references media_users(id) on delete cascade,
                  preferred_explanation_style text not null default 'balanced',
                  preferred_difficulty text not null default 'intermediate',
                  strengths text not null default '[]',
                  growth_areas text not null default '[]',
                  recurring_confusions text not null default '[]',
                  metadata text not null default '{}',
                  created_at text not null,
                  updated_at text not null
                );

                create table if not exists user_learning_events (
                  id text primary key,
                  user_id text not null references media_users(id) on delete cascade,
                  conversation_id text,
                  event_type text not null,
                  topic text,
                  metadata text not null default '{}',
                  created_at text not null
                );

                create table if not exists conversations (
                  id text primary key,
                  user_id text not null references media_users(id) on delete cascade,
                  title text not null,
                  archived integer not null default 0,
                  metadata text not null default '{}',
                  created_at text not null,
                  updated_at text not null
                );

                create table if not exists messages (
                  id text primary key,
                  conversation_id text not null references conversations(id) on delete cascade,
                  user_id text not null references media_users(id) on delete cascade,
                  role text not null,
                  content text not null,
                  model text,
                  effort text,
                  answer_status text,
                  verification_status text,
                  metadata text not null default '{}',
                  created_at text not null
                );

                create table if not exists knowledge_requests (
                  id text primary key,
                  user_id text not null references media_users(id) on delete cascade,
                  conversation_id text,
                  original_question text not null,
                  normalized_topic text,
                  normalized_subtopic text,
                  status text not null default 'pending',
                  request_count integer not null default 1,
                  created_at text not null
                );
                """
            )

    async def register(self, payload: AuthCredentials) -> dict[str, Any]:
        now = _now()
        user_id = str(uuid4())
        salt, password_hash = _hash_password(payload.password)
        profile_meta = {
            "full_name": payload.full_name,
            "carnet": payload.carnet,
            "university": payload.university,
            "role": payload.role,
            "specialty": payload.specialty,
            "academic_level": payload.academic_level,
            "learning_challenges": payload.learning_challenges,
        }
        with self._connect() as conn:
            try:
                conn.execute(
                    """
                    insert into media_users (
                      id, email, password_hash, password_salt, full_name, carnet, university,
                      role, specialty, academic_level, learning_challenges, created_at, updated_at
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        payload.email.lower(),
                        password_hash,
                        salt,
                        payload.full_name,
                        payload.carnet,
                        payload.university,
                        payload.role,
                        payload.specialty,
                        payload.academic_level,
                        payload.learning_challenges,
                        now,
                        now,
                    ),
                )
            except sqlite3.IntegrityError as exc:
                raise AuthenticationError("Este correo ya está registrado.") from exc
            conn.execute(
                """
                insert into user_learning_profiles (
                  user_id, growth_areas, recurring_confusions, metadata, created_at, updated_at
                ) values (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    _json_list(_split_learning(payload.learning_challenges)),
                    _json_list(_split_learning(payload.learning_challenges)),
                    json.dumps(profile_meta, ensure_ascii=False),
                    now,
                    now,
                ),
            )
        return await self._session_for_user(user_id)

    async def login(self, payload: AuthCredentials) -> dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute("select * from media_users where email = ?", (payload.email.lower(),)).fetchone()
        if row is None or not _verify_password(payload.password, row["password_salt"], row["password_hash"]):
            raise AuthenticationError("Correo o contraseña incorrectos.")
        return await self._session_for_user(row["id"])

    async def refresh_session(self, refresh_token: str) -> dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute("select user_id from media_sessions where refresh_token = ?", (refresh_token,)).fetchone()
        if row is None:
            raise AuthenticationError("Sesión inválida.")
        return await self._session_for_user(row["user_id"])

    async def get_user(self, access_token: str) -> AuthUser:
        with self._connect() as conn:
            row = conn.execute(
                """
                select u.* from media_sessions s
                join media_users u on u.id = s.user_id
                where s.access_token = ? and s.expires_at > ?
                """,
                (access_token, _now()),
            ).fetchone()
        if row is None:
            raise AuthenticationError("Sesión expirada o inválida.")
        return AuthUser(id=row["id"], email=row["email"], token=access_token, profile=_row_to_user(row))

    async def _session_for_user(self, user_id: str) -> dict[str, Any]:
        access_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(40)
        now = _now()
        expires = (datetime.now(UTC) + timedelta(days=30)).isoformat()
        with self._connect() as conn:
            conn.execute(
                "insert into media_sessions (access_token, refresh_token, user_id, expires_at, created_at) values (?, ?, ?, ?, ?)",
                (access_token, refresh_token, user_id, expires, now),
            )
            user = conn.execute("select * from media_users where id = ?", (user_id,)).fetchone()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 60 * 60 * 24 * 30,
            "user": _row_to_user(user),
        }

    async def health(self) -> bool:
        with self._connect() as conn:
            conn.execute("select 1").fetchone()
        return True

    async def request(self, *, table: str, method: str, token: str, params: dict[str, str] | None = None, json: Any = None, prefer: str | None = None) -> Any:
        user = await self.get_user(token)
        params = params or {}
        method = method.upper()
        if method == "GET":
            return self._select(table, str(user.id), params)
        if method == "POST":
            rows = self._insert(table, str(user.id), json or {})
            return rows if prefer == "return=representation" else None
        if method == "PATCH":
            self._patch(table, str(user.id), params, json or {})
            return None
        raise ValueError(f"Unsupported local request: {method} {table}")

    def _select(self, table: str, user_id: str, params: dict[str, str]) -> list[dict[str, Any]]:
        where = ["user_id = ?"]
        values: list[Any] = [user_id]
        for key, value in params.items():
            if key in {"select", "order", "limit"}:
                continue
            if value.startswith("eq."):
                where.append(f"{key} = ?")
                values.append(_sql_value(value[3:]))
        sql = f"select * from {table} where {' and '.join(where)}"
        order = params.get("order")
        if order:
            parts = order.split(".")
            column = parts[0]
            direction = "desc" if len(parts) > 1 and parts[1].lower() == "desc" else "asc"
            sql += f" order by {column} {direction}"
        limit = params.get("limit")
        if limit:
            sql += " limit ?"
            values.append(int(limit))
        with self._connect() as conn:
            rows = conn.execute(sql, values).fetchall()
        return [_decode_row(row) for row in rows]

    def _insert(self, table: str, user_id: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
        now = _now()
        row = dict(payload)
        if table != "user_learning_profiles":
            row.setdefault("id", str(uuid4()))
        row.setdefault("user_id", user_id)
        if table in {"conversations", "user_learning_profiles"}:
            row.setdefault("created_at", now)
            row.setdefault("updated_at", now)
        elif table in {"messages", "user_learning_events", "knowledge_requests"}:
            row.setdefault("created_at", now)
        if table == "conversations":
            row.setdefault("archived", False)
            row.setdefault("metadata", {})
        if table == "messages":
            row.setdefault("metadata", {})
        if table == "knowledge_requests":
            row.setdefault("status", "pending")
            row.setdefault("request_count", 1)
        encoded = {key: _encode_value(key, value) for key, value in row.items()}
        columns = list(encoded.keys())
        placeholders = ", ".join("?" for _ in columns)
        with self._connect() as conn:
            conn.execute(
                f"insert into {table} ({', '.join(columns)}) values ({placeholders})",
                [encoded[key] for key in columns],
            )
            if "id" in row:
                saved = conn.execute(f"select * from {table} where id = ?", (row["id"],)).fetchone()
            else:
                saved = conn.execute(f"select * from {table} where user_id = ?", (row["user_id"],)).fetchone()
        return [_decode_row(saved)] if saved is not None else []

    def _patch(self, table: str, user_id: str, params: dict[str, str], payload: dict[str, Any]) -> None:
        row_id = params.get("id", "")
        if not row_id.startswith("eq."):
            return
        updates = dict(payload)
        if table == "conversations":
            updates["updated_at"] = _now()
        encoded = {key: _encode_value(key, value) for key, value in updates.items()}
        assignments = ", ".join(f"{key} = ?" for key in encoded)
        values = list(encoded.values()) + [row_id[3:], user_id]
        with self._connect() as conn:
            conn.execute(f"update {table} set {assignments} where id = ? and user_id = ?", values)


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return base64.b64encode(salt).decode(), base64.b64encode(digest).decode()


def _verify_password(password: str, salt_b64: str, hash_b64: str) -> bool:
    salt = base64.b64decode(salt_b64.encode())
    expected = base64.b64decode(hash_b64.encode())
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return hmac.compare_digest(actual, expected)


def _row_to_user(row: sqlite3.Row | None) -> dict[str, Any]:
    if row is None:
        return {}
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "carnet": row["carnet"],
        "university": row["university"],
        "role": row["role"],
        "specialty": row["specialty"],
        "academic_level": row["academic_level"],
        "learning_challenges": row["learning_challenges"],
    }


def _encode_value(key: str, value: Any) -> Any:
    if isinstance(value, bool):
        return 1 if value else 0
    if key in JSON_COLUMNS or isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return value


def _decode_row(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    for key, value in list(data.items()):
        if key in JSON_COLUMNS or key in {"strengths", "growth_areas", "recurring_confusions"}:
            fallback = "{}" if key in {"metadata", "options", "practice_artifact"} else "[]"
            data[key] = json.loads(value or fallback)
        if key == "archived":
            data[key] = bool(value)
    return data


def _json_list(items: list[str]) -> str:
    return json.dumps(items, ensure_ascii=False)


def _split_learning(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.replace("\n", ",").split(",") if part.strip()][:12]


def _sql_value(value: str) -> Any:
    if value.lower() == "false":
        return 0
    if value.lower() == "true":
        return 1
    return value

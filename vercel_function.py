from __future__ import annotations

import asyncio
import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any, Awaitable, Callable


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def read_json(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("content-length") or 0)
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8") or "{}")


def write_json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", handler.headers.get("origin") or "*")
    handler.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def handle_options(handler: BaseHTTPRequestHandler) -> None:
    write_json(handler, 200, {"ok": True})


def run_async(awaitable: Awaitable[Any]) -> Any:
    return asyncio.run(awaitable)


def method_not_allowed(handler: BaseHTTPRequestHandler) -> None:
    write_json(handler, 405, {"detail": "Method not allowed"})


def bad_request(handler: BaseHTTPRequestHandler, message: str = "Invalid request") -> None:
    write_json(handler, 400, {"detail": message})


def unauthorized(handler: BaseHTTPRequestHandler, message: str = "Could not authenticate.") -> None:
    write_json(handler, 401, {"detail": message})


def session_response(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
        "token_type": data.get("token_type") or "bearer",
        "expires_in": data.get("expires_in"),
        "message": data.get("message"),
        "user": data.get("user") or {},
    }


def auth_handler(action: Callable[[Any, Any], Awaitable[dict[str, Any]]]) -> type[BaseHTTPRequestHandler]:
    from app.core.config import get_settings
    from app.core.exceptions import AuthenticationError
    from app.db.supabase import SupabaseClient
    from app.models.schemas import AuthCredentials, RefreshTokenIn

    class SupabaseAuthAdapter:
        def __init__(self) -> None:
            self.client = SupabaseClient(get_settings())

        async def register(self, payload: AuthCredentials) -> dict[str, Any]:
            return await self.client.sign_up(payload=payload)

        async def login(self, payload: AuthCredentials) -> dict[str, Any]:
            return await self.client.sign_in_with_password(email=payload.email, password=payload.password)

        async def refresh_session(self, *, refresh_token: str) -> dict[str, Any]:
            return await self.client.refresh_session(refresh_token=refresh_token)

    class Handler(BaseHTTPRequestHandler):
        def do_OPTIONS(self) -> None:
            handle_options(self)

        def do_POST(self) -> None:
            try:
                payload = read_json(self)
                store = SupabaseAuthAdapter()
                if action.__name__ == "refresh":
                    parsed = RefreshTokenIn(**payload)
                else:
                    parsed = AuthCredentials(**payload)
                data = run_async(action(store, parsed))
                write_json(self, 200, session_response(data))
            except AuthenticationError as exc:
                unauthorized(self, str(exc))
            except Exception as exc:
                bad_request(self, str(exc))

        def do_GET(self) -> None:
            method_not_allowed(self)

    return Handler

import base64
import json
import time
from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import AuthenticationError, ProviderError
from app.models.schemas import AuthCredentials, AuthUser


class SupabaseClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = settings.supabase_url.rstrip("/")

    async def get_user(self, token: str) -> AuthUser:
        if not self.settings.supabase_configured:
            raise AuthenticationError("Supabase is not configured")
        decoded = self._decode_user_from_jwt(token)
        if decoded is not None:
            return decoded
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.get(
                f"{self.base_url}/auth/v1/user",
                headers={"apikey": self.settings.supabase_publishable_key, "Authorization": f"Bearer {token}"},
            )
        if response.status_code != 200:
            raise AuthenticationError("Invalid Supabase token")
        data = response.json()
        return AuthUser(id=data["id"], email=data.get("email"), token=token)

    def _decode_user_from_jwt(self, token: str) -> AuthUser | None:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            payload = parts[1] + "=" * (-len(parts[1]) % 4)
            data = json.loads(base64.urlsafe_b64decode(payload.encode("ascii")))
            subject = data.get("sub")
            if not subject:
                return None
            expires_at = data.get("exp")
            if isinstance(expires_at, (int, float)) and expires_at <= time.time():
                raise AuthenticationError("Sesión expirada o inválida.")
            return AuthUser(id=subject, email=data.get("email"), token=token)
        except AuthenticationError:
            raise
        except Exception:
            return None

    async def sign_up(self, *, payload: AuthCredentials) -> dict[str, Any]:
        return await self._auth_request(
            "signup",
            {
                "email": payload.email,
                "password": payload.password,
                "data": {
                    "full_name": payload.full_name,
                    "carnet": payload.carnet,
                    "university": payload.university,
                    "role": payload.role,
                    "specialty": payload.specialty,
                    "academic_level": payload.academic_level,
                    "learning_challenges": payload.learning_challenges,
                },
            },
        )

    async def sign_in_with_password(self, *, email: str, password: str) -> dict[str, Any]:
        return await self._auth_request("token?grant_type=password", {"email": email, "password": password})

    async def refresh_session(self, *, refresh_token: str) -> dict[str, Any]:
        return await self._auth_request("token?grant_type=refresh_token", {"refresh_token": refresh_token})

    async def _auth_request(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.settings.supabase_configured:
            raise AuthenticationError("Supabase is not configured")
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/auth/v1/{path}",
                headers={"apikey": self.settings.supabase_publishable_key, "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code >= 400:
            detail = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            message = detail.get("msg") or detail.get("message") or "Supabase Auth request failed"
            raise AuthenticationError(message)
        return response.json()

    async def health(self) -> bool:
        if not self.settings.supabase_configured:
            return False
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/",
                headers={"apikey": self.settings.supabase_publishable_key},
            )
        return response.status_code in {200, 401, 404}


class SupabaseRepository:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = settings.supabase_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=self.settings.request_timeout_seconds)

    async def request(self, *, table: str, method: str, token: str, params: dict[str, str] | None = None, json: Any = None, prefer: str | None = None) -> Any:
        headers = {
            "apikey": self.settings.supabase_publishable_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        response = await self._client.request(method, f"{self.base_url}/rest/v1/{table}", headers=headers, params=params, json=json)
        if response.status_code >= 400:
            raise ProviderError(f"Supabase table request failed for {table}", response.status_code)
        if not response.content:
            return None
        return response.json()

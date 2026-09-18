from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, unauthorized
from app.db.supabase import SupabaseClient
from app.models.schemas import AuthUser

bearer = HTTPBearer(auto_error=False)


async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), settings: Settings = Depends(get_settings)) -> AuthUser:
    if credentials is None:
        raise unauthorized()
    try:
        return await SupabaseClient(settings).get_user(credentials.credentials)
    except AuthenticationError as exc:
        raise unauthorized(str(exc)) from exc

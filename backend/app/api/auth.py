from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, unauthorized
from app.db.supabase import SupabaseClient
from app.models.schemas import AuthCredentials, AuthSessionOut, RefreshTokenIn

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionOut)
async def register(payload: AuthCredentials, settings: Settings = Depends(get_settings)) -> AuthSessionOut:
    try:
        data = await SupabaseClient(settings).sign_up(payload=payload)
    except AuthenticationError as exc:
        raise unauthorized(str(exc)) from exc
    return _session_response(data)


@router.post("/login", response_model=AuthSessionOut)
async def login(payload: AuthCredentials, settings: Settings = Depends(get_settings)) -> AuthSessionOut:
    try:
        data = await SupabaseClient(settings).sign_in_with_password(email=payload.email, password=payload.password)
    except AuthenticationError as exc:
        raise unauthorized(str(exc)) from exc
    return _session_response(data)


@router.post("/refresh", response_model=AuthSessionOut)
async def refresh(payload: RefreshTokenIn, settings: Settings = Depends(get_settings)) -> AuthSessionOut:
    try:
        data = await SupabaseClient(settings).refresh_session(refresh_token=payload.refresh_token)
    except AuthenticationError as exc:
        raise unauthorized(str(exc)) from exc
    return _session_response(data)


def _session_response(data: dict) -> AuthSessionOut:
    return AuthSessionOut(
        access_token=data.get("access_token"),
        refresh_token=data.get("refresh_token"),
        token_type=data.get("token_type") or "bearer",
        expires_in=data.get("expires_in"),
        message=data.get("message"),
        user=data.get("user") or {},
    )

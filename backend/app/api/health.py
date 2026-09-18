from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.db.supabase import SupabaseClient
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    database_ok = await SupabaseClient(settings).health()
    database = "healthy" if database_ok else "unavailable"
    ai = "healthy" if settings.cloudflare_configured else "unavailable"
    status = "healthy" if database == "healthy" and ai == "healthy" else "degraded"
    return HealthResponse(
        status=status,
        backend="healthy",
        database=database,
        ai_provider_configuration=ai,
        details={
            "strict_document_grounding": settings.strict_document_grounding,
            "models_configured": {
                "low": bool(settings.ai_model_low),
                "medium": bool(settings.ai_model_medium),
                "high": bool(settings.ai_model_high),
                "embedding": bool(settings.ai_embedding_model),
            },
        },
    )

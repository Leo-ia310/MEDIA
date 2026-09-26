from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.db.supabase import SupabaseClient
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    database_ok = await SupabaseClient(settings).health()
    database = "healthy" if database_ok else "unavailable"
    groq = "healthy" if settings.groq_configured else "unavailable"
    cloudflare = "healthy" if settings.cloudflare_configured else "unavailable"
    ai = "healthy" if settings.groq_configured else "degraded" if settings.cloudflare_configured else "unavailable"
    gemini = "healthy" if settings.gemini_configured else "unavailable"
    obsidian_paths = settings.obsidian_memory_paths
    obsidian_available_paths = [str(path) for path in obsidian_paths if path.exists()]
    obsidian_status = (
        "disabled"
        if not settings.obsidian_retrieval_enabled
        else "healthy"
        if obsidian_available_paths
        else "unavailable"
    )
    status = "healthy" if database == "healthy" and ai == "healthy" else "degraded"
    return HealthResponse(
        status=status,
        backend="healthy",
        database=database,
        ai_provider_configuration=ai,
        details={
            "strict_document_grounding": settings.strict_document_grounding,
            "providers": {
                "primary": {
                    "provider": "groq",
                    "status": groq,
                    "low_model": settings.groq_low_model,
                    "medium_model": settings.groq_medium_model,
                    "high_model": settings.groq_high_model,
                    "vision_model": settings.groq_vision_model,
                },
                "fallback": {
                    "provider": "cloudflare",
                    "status": cloudflare,
                    "model": settings.cloudflare_text_model,
                },
            },
            "models_configured": {
                "low": bool(settings.groq_low_model),
                "medium": bool(settings.groq_medium_model),
                "high": bool(settings.groq_high_model),
                "vision": bool(settings.groq_vision_model),
                "embedding": bool(settings.ai_embedding_model),
                "gemini_image": bool(settings.gemini_image_model),
                "gemini_image_quality": bool(settings.gemini_image_quality_model),
            },
            "image_generation": {
                "provider": "gemini",
                "status": gemini,
                "model": settings.gemini_image_model,
                "quality_model": settings.gemini_image_quality_model,
            },
            "obsidian_memory": {
                "status": obsidian_status,
                "vault_path": settings.obsidian_vault_path,
                "configured_paths": [str(path) for path in obsidian_paths],
                "available_paths": obsidian_available_paths,
            },
        },
    )

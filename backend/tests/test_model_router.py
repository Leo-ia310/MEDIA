from app.ai.model_router import ModelRouter
from app.core.config import Settings
from app.models.schemas import Effort


def test_effort_routes_to_configured_models() -> None:
    settings = Settings(
        ai_model_low="@cf/zai-org/glm-4.7-flash",
        ai_model_medium="@cf/qwen/qwen3.8-27b",
        ai_model_high="@cf/qwen/qwen3.8-27b",
    )
    router = ModelRouter(settings)

    assert router.select(Effort.low).model_id == "@cf/zai-org/glm-4.7-flash"
    assert router.select(Effort.medium).model_id == "@cf/qwen/qwen3.8-27b"
    assert router.select(Effort.high).model_id == "@cf/qwen/qwen3.8-27b"
    assert router.select(Effort.high).retrieval_top_k > router.select(Effort.low).retrieval_top_k

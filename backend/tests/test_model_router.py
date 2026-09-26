from app.ai.model_router import ModelRouter
from app.core.config import Settings
from app.models.schemas import Effort


def test_effort_routes_to_configured_groq_models() -> None:
    settings = Settings(
        groq_low_model="openai/gpt-oss-20b",
        groq_medium_model="qwen/qwen3.8-27b",
        groq_high_model="openai/gpt-oss-120b",
    )
    router = ModelRouter(settings)

    assert router.select(Effort.low).model_id == "openai/gpt-oss-20b"
    assert router.select(Effort.low).reasoning_effort == "low"
    assert router.select(Effort.medium).model_id == "qwen/qwen3.8-27b"
    assert router.select(Effort.medium).reasoning_effort == "medium"
    assert router.select(Effort.high).model_id == "openai/gpt-oss-120b"
    assert router.select(Effort.high).reasoning_effort == "high"
    assert router.select(Effort.high).retrieval_top_k > router.select(Effort.low).retrieval_top_k


def test_effort_token_budgets_are_large_enough_for_medical_answers() -> None:
    router = ModelRouter(Settings())

    assert router.select(Effort.low).max_tokens >= 1200
    assert router.select(Effort.medium).max_tokens >= 2200
    assert router.select(Effort.high).max_tokens >= 3200


def test_router_keeps_simple_prompts_low() -> None:
    router = ModelRouter(Settings())

    assert router.effective_effort(Effort.low, "dime las partes del cuerpo") == Effort.low


def test_router_escalates_low_prompt_to_medium_when_medical_explanation_is_needed() -> None:
    router = ModelRouter(Settings())

    assert router.effective_effort(Effort.low, "explica la hipertension y su tratamiento") == Effort.medium


def test_router_escalates_low_prompt_to_high_when_prompt_is_complex() -> None:
    router = ModelRouter(Settings())
    prompt = (
        "Explica el eje renina angiotensina aldosterona y como se relaciona con hipertension, "
        "enfermedad renal cronica e insuficiencia cardiaca. Incluye farmacos, riesgos de "
        "hiperpotasemia y por que vigilar creatinina y potasio."
    )

    assert router.effective_effort(Effort.low, prompt) == Effort.high
    assert router.select_for_prompt(Effort.low, prompt).effort == Effort.high


def test_router_does_not_downgrade_user_requested_medium_or_high() -> None:
    router = ModelRouter(Settings())

    assert router.effective_effort(Effort.medium, "hola") == Effort.medium
    assert router.effective_effort(Effort.high, "hola") == Effort.high


def test_image_request_uses_groq_vision_model_and_requested_reasoning() -> None:
    router = ModelRouter(Settings(groq_vision_model="qwen/qwen3.8-27b"))

    low = router.select_for_request(Effort.low, "explicame esta imagen", has_image=True)
    high = router.select_for_request(Effort.high, "explicame esta imagen", has_image=True)

    assert low.model_id == "qwen/qwen3.8-27b"
    assert low.supports_vision is True
    assert low.reasoning_effort == "low"
    assert high.model_id == "qwen/qwen3.8-27b"
    assert high.reasoning_effort == "high"

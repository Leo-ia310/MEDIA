from pathlib import Path
from app.main import app


def test_auth_routes_are_registered_in_openapi() -> None:
    schema = app.openapi()

    assert "/api/auth/register" in schema["paths"]
    assert "/api/auth/login" in schema["paths"]
    assert "/api/auth/refresh" in schema["paths"]
    assert "/api/tools/image" in schema["paths"]


from app.ai.orchestrator import AIOrchestrator


def test_orchestrator_detects_truncated_spanish_answers() -> None:
    checker = AIOrchestrator.__new__(AIOrchestrator)

    assert checker._looks_truncated("La elevación del potasio") is True
    assert checker._looks_truncated("La elevación del potasio requiere vigilancia clínica.") is False


from uuid import UUID

import pytest

from app.ai.model_router import ModelRouter
from app.ai.schemas import LLMResponse
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError
from app.models.schemas import AuthUser, ChatRequest, Effort


class NoopRetrieval:
    async def retrieve(self, **kwargs):
        return []


class NoopProjectContext:
    async def retrieve(self, **kwargs):
        return []


class FallbackProvider:
    def __init__(self):
        self.efforts = []

    async def generate(self, *, messages, selection):
        self.efforts.append(selection.effort)
        if selection.effort == Effort.high:
            raise ModelUnavailableError("Model unavailable or invalid: @cf/qwen/qwen3.8-27b")
        return LLMResponse(
            text="Respuesta final completa.",
            model=selection.model_id,
            provider="fake",
            latency_ms=1,
            usage={},
        )


@pytest.mark.asyncio
async def test_orchestrator_falls_back_to_low_when_auto_effort_model_is_unavailable() -> None:
    settings = Settings()
    provider = FallbackProvider()
    orchestrator = AIOrchestrator(
        settings,
        provider,
        ModelRouter(settings),
        NoopRetrieval(),
        NoopProjectContext(),
        AnswerVerifier(),
    )
    request = ChatRequest(
        message=(
            "Explica el eje renina angiotensina aldosterona y como se relaciona con hipertension, "
            "enfermedad renal cronica e insuficiencia cardiaca. Incluye farmacos, riesgos de hiperpotasemia."
        ),
        effort=Effort.low,
    )

    response = await orchestrator.answer(
        request=request,
        user=AuthUser(id=UUID("11111111-1111-1111-1111-111111111111"), token="token"),
        conversation_id=UUID("22222222-2222-2222-2222-222222222222"),
        message_id=UUID("33333333-3333-3333-3333-333333333333"),
        recent_messages=[],
        learning_profile={},
    )

    assert provider.efforts == [Effort.high, Effort.low]
    assert response.effort == Effort.low
    assert response.metadata["fallback_used"] is True
    assert response.answer == "Respuesta final completa."


def test_frontend_does_not_expose_provider_api_key_names() -> None:
    frontend = Path(__file__).resolve().parents[2] / "app.js"
    text = frontend.read_text(encoding="utf-8")

    assert "GROQ_API_KEY" not in text
    assert "GEMINI_API_KEY" not in text
    assert "CLOUDFLARE_API_TOKEN" not in text
    assert "NEXT_PUBLIC_GROQ_API_KEY" not in text
    assert "NEXT_PUBLIC_GEMINI_API_KEY" not in text


def test_orchestrator_removes_inline_model_citations() -> None:
    checker = AIOrchestrator.__new__(AIOrchestrator)

    cleaned, metadata = checker._sanitize_model_citations(
        "Reduce mortalidad (guías)【Fuente 2†L186-L194】 y mejora síntomas †L20-L22."
    )

    assert "【Fuente" not in cleaned
    assert "†L" not in cleaned
    assert "Reduce mortalidad" in cleaned
    assert metadata["removed_inline_model_citations"] is True

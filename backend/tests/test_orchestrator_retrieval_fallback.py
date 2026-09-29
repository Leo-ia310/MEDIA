from uuid import UUID

import pytest

from app.ai.model_router import ModelRouter
from app.ai.orchestrator import AIOrchestrator
from app.ai.schemas import LLMResponse
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings
from app.core.exceptions import ProviderError
from app.models.schemas import AnswerStatus, AuthUser, ChatRequest


class FailingRetrieval:
    async def retrieve(self, **kwargs):
        raise ProviderError("Supabase table request failed for medical_chunks")


class EmptyProjectContext:
    async def retrieve(self, **kwargs):
        return []


class FakeProvider:
    async def generate(self, **kwargs):
        return LLMResponse(
            text="Las arterias son vasos sanguineos que llevan sangre desde el corazon hacia los tejidos.",
            model="fake-model",
            provider="fake",
            latency_ms=1,
            usage={},
        )


@pytest.mark.asyncio
async def test_non_strict_chat_continues_when_medical_retrieval_fails() -> None:
    settings = Settings(strict_document_grounding=False)
    orchestrator = AIOrchestrator(
        settings=settings,
        provider=FakeProvider(),
        router=ModelRouter(settings),
        retrieval=FailingRetrieval(),
        project_context=EmptyProjectContext(),
        verifier=AnswerVerifier(),
    )

    response = await orchestrator.answer(
        request=ChatRequest(message="que son las arterias?"),
        user=AuthUser(id=UUID("11111111-1111-1111-1111-111111111111"), token="token"),
        conversation_id=UUID("22222222-2222-2222-2222-222222222222"),
        message_id=UUID("33333333-3333-3333-3333-333333333333"),
        recent_messages=[],
        learning_profile={},
    )

    assert "Las arterias" in response.answer
    assert response.answer_status == AnswerStatus.unverified_model_knowledge
    assert response.metadata["medical_retrieval_count"] == 0
    assert "medical_chunks" in response.metadata["medical_retrieval_error"]

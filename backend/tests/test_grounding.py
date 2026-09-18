import pytest

from app.ai.verifier import AnswerVerifier
from app.models.schemas import AnswerStatus, VerificationStatus


@pytest.mark.asyncio
async def test_strict_grounding_without_evidence_abstains() -> None:
    result = await AnswerVerifier().verify(answer="respuesta", evidence=[], strict_grounding=True)

    assert result.answer_status == AnswerStatus.insufficient_evidence
    assert result.verification_status == VerificationStatus.insufficient_evidence
    assert result.needs_regeneration is False


@pytest.mark.asyncio
async def test_non_strict_without_evidence_marks_unverified() -> None:
    result = await AnswerVerifier().verify(answer="respuesta", evidence=[], strict_grounding=False)

    assert result.answer_status == AnswerStatus.unverified_model_knowledge
    assert result.verification_status == VerificationStatus.unverified_model_knowledge

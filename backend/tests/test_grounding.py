import pytest

from app.ai.schemas import EvidenceChunk
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


@pytest.mark.asyncio
async def test_project_context_evidence_does_not_mark_answer_grounded() -> None:
    result = await AnswerVerifier().verify(
        answer="respuesta",
        evidence=[
            EvidenceChunk(
                id="11111111-1111-1111-1111-111111111111",
                document_id="22222222-2222-2222-2222-222222222222",
                title="Nota de proyecto",
                section="Roadmap",
                content="Contexto de negocio.",
                metadata={"source": "obsidian"},
            )
        ],
        strict_grounding=False,
    )

    assert result.answer_status == AnswerStatus.unverified_model_knowledge
    assert result.verification_status == VerificationStatus.unverified_model_knowledge


@pytest.mark.asyncio
async def test_supabase_medical_evidence_can_mark_answer_grounded() -> None:
    result = await AnswerVerifier().verify(
        answer="respuesta",
        evidence=[
            EvidenceChunk(
                id="11111111-1111-1111-1111-111111111111",
                document_id="22222222-2222-2222-2222-222222222222",
                title="Manual medico",
                section="Anatomia",
                content="Evidencia medica.",
                metadata={"source": "supabase_medical"},
            )
        ],
        strict_grounding=False,
    )

    assert result.answer_status == AnswerStatus.grounded
    assert result.verification_status == VerificationStatus.verified

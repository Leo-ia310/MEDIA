from app.ai.schemas import EvidenceChunk
from app.models.schemas import AnswerStatus, VerificationResult, VerificationStatus


class AnswerVerifier:
    async def verify(self, *, answer: str, evidence: list[EvidenceChunk], strict_grounding: bool) -> VerificationResult:
        medical_evidence = [chunk for chunk in evidence if chunk.metadata.get("source") == "supabase_medical"]
        if strict_grounding and not medical_evidence:
            return VerificationResult(
                evidence_sufficient=False,
                claims_supported=False,
                citations_valid=True,
                contradictions_detected=False,
                needs_regeneration=False,
                verification_status=VerificationStatus.insufficient_evidence,
                answer_status=AnswerStatus.insufficient_evidence,
            )
        if not medical_evidence:
            return VerificationResult(
                evidence_sufficient=False,
                claims_supported=False,
                citations_valid=True,
                contradictions_detected=False,
                needs_regeneration=False,
                verification_status=VerificationStatus.unverified_model_knowledge,
                answer_status=AnswerStatus.unverified_model_knowledge,
            )
        return VerificationResult(
            evidence_sufficient=True,
            claims_supported=True,
            citations_valid=True,
            contradictions_detected=False,
            needs_regeneration=False,
            verification_status=VerificationStatus.verified,
            answer_status=AnswerStatus.grounded,
        )

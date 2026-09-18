from pathlib import Path
from dataclasses import replace

from app.ai.model_router import ModelRouter
from app.ai.providers.base import LLMProvider
from app.ai.retrieval import RetrievalService
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings
from app.core.exceptions import ProviderError
from app.models.schemas import AnswerStatus, AuthUser, ChatRequest, ChatResponse, Effort, VerificationStatus


class AIOrchestrator:
    def __init__(self, settings: Settings, provider: LLMProvider, router: ModelRouter, retrieval: RetrievalService, verifier: AnswerVerifier) -> None:
        self.settings = settings
        self.provider = provider
        self.router = router
        self.retrieval = retrieval
        self.verifier = verifier
        self.system_prompt = (Path(__file__).parent / "prompts" / "tutor_system.md").read_text(encoding="utf-8")

    async def answer(self, *, request: ChatRequest, user: AuthUser, conversation_id, message_id, recent_messages: list[dict[str, str]], learning_profile: dict) -> ChatResponse:
        selection = self.router.select(request.effort)
        evidence = await self.retrieval.retrieve(question=request.message, user_id=str(user.id), top_k=selection.retrieval_top_k)
        if self.settings.strict_document_grounding and not evidence:
            return ChatResponse(
                conversation_id=conversation_id,
                message_id=message_id,
                answer="No encuentro suficiente informacion en las fuentes disponibles para responder esta pregunta con el nivel de respaldo requerido.",
                answer_status=AnswerStatus.insufficient_evidence,
                verification_status=VerificationStatus.insufficient_evidence,
                effort=request.effort,
                model=selection.model_id,
                citations=[],
                can_request_knowledge=True,
                metadata={"retrieval_count": 0, "strict_document_grounding": True},
            )

        messages = self._build_messages(request.message, recent_messages, evidence, learning_profile)
        fallback_used = False
        retry_used = False
        try:
            llm_response = await self.provider.generate(messages=messages, selection=selection)
        except ProviderError as exc:
            if self._can_retry_with_more_tokens(exc):
                retry_used = True
                retry_selection = replace(selection, max_tokens=max(selection.max_tokens * 2, 1200))
                retry_messages = [
                    *messages,
                    {"role": "system", "content": "Entrega solo la respuesta final breve en espanol en el campo content. No incluyas razonamiento interno."},
                ]
                llm_response = await self.provider.generate(messages=retry_messages, selection=retry_selection)
            elif not self._can_retry_low(request, exc):
                raise
            else:
                fallback_used = True
                selection = self.router.select(Effort.low)
                llm_response = await self.provider.generate(messages=messages, selection=selection)
        verification = await self.verifier.verify(answer=llm_response.text, evidence=evidence, strict_grounding=self.settings.strict_document_grounding)
        citations = [chunk.citation() for chunk in evidence]
        return ChatResponse(
            conversation_id=conversation_id,
            message_id=message_id,
            answer=llm_response.text,
            answer_status=verification.answer_status,
            verification_status=verification.verification_status,
            effort=request.effort,
            model=llm_response.model,
            citations=citations,
            can_request_knowledge=verification.answer_status == AnswerStatus.insufficient_evidence,
            metadata={
                "provider": llm_response.provider,
                "latency_ms": llm_response.latency_ms,
                "usage": llm_response.usage,
                "retrieval_count": len(evidence),
                "strict_document_grounding": self.settings.strict_document_grounding,
                "fallback_used": fallback_used,
                "retry_used": retry_used,
            },
        )

    def _build_messages(self, question: str, recent_messages: list[dict[str, str]], evidence, learning_profile: dict) -> list[dict[str, str]]:
        evidence_text = "\n\n".join(f"[Fuente {i + 1}] {chunk.title} {chunk.section or ''}\n{chunk.content}" for i, chunk in enumerate(evidence))
        profile_text = f"Perfil educativo resumido: {learning_profile}" if learning_profile else "Perfil educativo resumido: no disponible todavia."
        final_answer_instruction = "Entrega siempre una respuesta final visible, breve y clara en espanol. No dejes el contenido final vacio. No incluyas razonamiento interno."
        system = f"{self.system_prompt}\n\n{final_answer_instruction}\n\n{profile_text}\n\nEvidencia recuperada:\n{evidence_text or 'No hay evidencia documental recuperada.'}"
        return [{"role": "system", "content": system}, *recent_messages[-8:], {"role": "user", "content": question}]

    def _can_retry_low(self, request: ChatRequest, exc: ProviderError) -> bool:
        return (
            self.settings.ai_timeout_fallback_to_low
            and request.effort.value != "low"
            and "timed out" in str(exc).lower()
        )

    def _can_retry_with_more_tokens(self, exc: ProviderError) -> bool:
        message = str(exc).lower()
        return "empty or unsupported response" in message or "no final answer" in message

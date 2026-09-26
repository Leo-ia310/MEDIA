from pathlib import Path
from dataclasses import replace
import re

from app.ai.model_router import ModelRouter
from app.ai.project_context import ProjectContextService
from app.ai.providers.base import LLMProvider
from app.ai.retrieval import RetrievalService
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError, ProviderError
from app.models.schemas import AnswerStatus, AuthUser, ChatRequest, ChatResponse, Effort, VerificationStatus


class AIOrchestrator:
    def __init__(self, settings: Settings, provider: LLMProvider, router: ModelRouter, retrieval: RetrievalService, project_context: ProjectContextService, verifier: AnswerVerifier) -> None:
        self.settings = settings
        self.provider = provider
        self.router = router
        self.retrieval = retrieval
        self.project_context = project_context
        self.verifier = verifier
        self.system_prompt = (Path(__file__).parent / "prompts" / "tutor_system.md").read_text(encoding="utf-8")

    async def answer(self, *, request: ChatRequest, user: AuthUser, conversation_id, message_id, recent_messages: list[dict[str, str]], learning_profile: dict) -> ChatResponse:
        image_attachments = self._image_attachments(request)
        selection = self.router.select_for_request(request.effort, request.message, has_image=bool(image_attachments))
        evidence = await self.retrieval.retrieve(question=request.message, token=user.token, top_k=selection.retrieval_top_k)
        project_context = await self.project_context.retrieve(question=request.message, top_k=self.settings.project_context_top_k)
        if self.settings.strict_document_grounding and not evidence:
            return ChatResponse(
                conversation_id=conversation_id,
                message_id=message_id,
                answer="No encuentro suficiente informacion en las fuentes disponibles para responder esta pregunta con el nivel de respaldo requerido.",
                answer_status=AnswerStatus.insufficient_evidence,
                verification_status=VerificationStatus.insufficient_evidence,
                effort=selection.effort,
                model=selection.model_id,
                citations=[],
                can_request_knowledge=True,
                metadata={
                    "medical_retrieval_count": 0,
                    "project_context_count": len(project_context),
                    "strict_document_grounding": True,
                },
            )

        messages = self._build_messages(request.message, recent_messages, evidence, project_context, learning_profile, image_attachments=image_attachments)
        fallback_used = False
        retry_used = False
        try:
            llm_response = await self.provider.generate(messages=messages, selection=selection)
        except ProviderError as exc:
            if self._can_fallback_to_low(selection, exc):
                fallback_used = True
                selection = self.router.select(Effort.low)
                llm_response = await self.provider.generate(messages=messages, selection=selection)
            elif self._can_retry_with_more_tokens(exc):
                retry_used = True
                retry_selection = replace(selection, max_tokens=max(selection.max_tokens * 2, 1200))
                retry_messages = [
                    *messages,
                    {"role": "system", "content": "Entrega solo la respuesta final breve en espanol en el campo content. No incluyas razonamiento interno."},
                ]
                llm_response = await self.provider.generate(messages=retry_messages, selection=retry_selection)
            else:
                raise
        if self._looks_truncated(llm_response.text):
            retry_used = True
            retry_selection = replace(selection, max_tokens=max(selection.max_tokens * 2, 2600))
            retry_messages = [
                *messages,
                {
                    "role": "system",
                    "content": "La respuesta anterior quedo incompleta o cortada. Reescribe una respuesta completa en espanol, con cierre claro. No termines en medio de una frase.",
                },
            ]
            retry_response = await self.provider.generate(messages=retry_messages, selection=retry_selection)
            if retry_response.text and not self._looks_truncated(retry_response.text):
                llm_response = retry_response

        sanitized_answer, citation_sanitization = self._sanitize_model_citations(llm_response.text)
        llm_response.text = sanitized_answer
        verification = await self.verifier.verify(answer=llm_response.text, evidence=evidence, strict_grounding=self.settings.strict_document_grounding)
        citations = [chunk.citation() for chunk in evidence]
        return ChatResponse(
            conversation_id=conversation_id,
            message_id=message_id,
            answer=llm_response.text,
            answer_status=verification.answer_status,
            verification_status=verification.verification_status,
            effort=selection.effort,
            model=llm_response.model,
            citations=citations,
            can_request_knowledge=verification.answer_status == AnswerStatus.insufficient_evidence,
            metadata={
                "requested_effort": request.effort.value,
                "effective_effort": selection.effort.value,
                "auto_effort_applied": selection.effort != request.effort,
                "provider": llm_response.provider,
                "primary_provider": (llm_response.usage or {}).get("primary_provider", llm_response.provider),
                "fallback_reason": (llm_response.usage or {}).get("fallback_reason"),
                "provider_latency_ms": (llm_response.usage or {}).get("provider_latency_ms", llm_response.latency_ms),
                "latency_ms": llm_response.latency_ms,
                "usage": llm_response.usage,
                "has_image_attachments": bool(image_attachments),
                "medical_retrieval_count": len(evidence),
                "project_context_count": len(project_context),
                "strict_document_grounding": self.settings.strict_document_grounding,
                "fallback_used": fallback_used,
                "retry_used": retry_used,
                "citation_sanitization": citation_sanitization,
            },
        )

    def _build_messages(self, question: str, recent_messages: list[dict[str, str]], evidence, project_context, learning_profile: dict, *, image_attachments: list[dict]) -> list[dict]:
        evidence_text = "\n\n".join(f"[Fuente medica {i + 1}] {chunk.title} {chunk.section or ''}\n{chunk.content}" for i, chunk in enumerate(evidence))
        project_context_text = "\n\n".join(
            f"[Contexto de proyecto {i + 1}] {chunk.title} {chunk.section or ''}\n{chunk.content}"
            for i, chunk in enumerate(project_context)
        )
        profile_text = f"Perfil educativo resumido: {learning_profile}" if learning_profile else "Perfil educativo resumido: no disponible todavia."
        final_answer_instruction = (
            "Entrega siempre una respuesta final visible, clara y completa en espanol. "
            "No dejes el contenido final vacio, no incluyas razonamiento interno y no termines en medio de una frase. "
            "Para preguntas complejas usa secciones breves: mecanismo, relacion clinica, farmacos, riesgos, monitoreo y cierre practico. "
            "No escribas citas dentro de la respuesta: prohibido usar formatos como 【Fuente 1†L10-L20】, [1], (Fuente 2) o paginas inventadas. "
            "Las fuentes verificadas las agrega el backend al final usando metadata real del RAG."
        )
        project_context_instruction = (
            "Contexto de proyecto/negocio desde Obsidian: sirve solo para entender decisiones, arquitectura, roadmap y estado del producto. "
            "No es base de datos, no es evidencia medica, no lo cites como fuente medica y no lo uses para marcar una respuesta como verificada."
        )
        system = (
            f"{self.system_prompt}\n\n{final_answer_instruction}\n\n{profile_text}"
            f"\n\nEvidencia medica verificada desde Supabase:\n{evidence_text or 'No hay evidencia medica documental recuperada.'}"
            f"\n\n{project_context_instruction}\n{project_context_text or 'No hay contexto de proyecto recuperado.'}"
        )
        user_message = {"role": "user", "content": question}
        if image_attachments:
            content = [{"type": "text", "text": question}]
            content.extend({"type": "image_url", "image_url": {"url": attachment["url"]}} for attachment in image_attachments)
            user_message = {"role": "user", "content": content}
        return [{"role": "system", "content": system}, *recent_messages[-8:], user_message]

    def _image_attachments(self, request: ChatRequest) -> list[dict]:
        images = []
        for attachment in request.attachments:
            mime_type = attachment.mime_type or ""
            url = attachment.url or ""
            if attachment.type == "image" and url and (url.startswith("data:image/") or url.startswith("https://") or url.startswith("http://")):
                images.append({"url": url, "mime_type": mime_type, "name": attachment.name})
        return images[:4]

    def _can_fallback_to_low(self, selection, exc: ProviderError) -> bool:
        if selection.effort == Effort.low:
            return False
        message = str(exc).lower()
        if isinstance(exc, ModelUnavailableError):
            return True
        return (
            self.settings.ai_timeout_fallback_to_low
            and (
                "timed out" in message
                or "model unavailable" in message
                or "model unavailable or invalid" in message
                or "invalid" in message
            )
        )

    def _can_retry_with_more_tokens(self, exc: ProviderError) -> bool:
        message = str(exc).lower()
        return "empty or unsupported response" in message or "no final answer" in message

    def _looks_truncated(self, text: str) -> bool:
        stripped = text.rstrip()
        if not stripped:
            return True
        if stripped.endswith((".", "?", "!", ")", "]")):
            return False
        lower = stripped.lower()
        unfinished_endings = (
            " de",
            " del",
            " la",
            " el",
            " y",
            " o",
            " que",
            " para",
            " con",
            " por",
            " en",
            " como",
            " lo",
            " los",
            " las",
            " un",
            " una",
            ":",
            ",",
            ";",
        )
        word_count = len(stripped.split())
        return lower.endswith(unfinished_endings) or word_count > 3


    def _sanitize_model_citations(self, text: str) -> tuple[str, dict]:
        original = text
        cleaned = re.sub(r"【[^】]*(?:Fuente|source|†|L\d+)[^】]*】", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*†L\d+(?:-L?\d+)?", "", cleaned)
        cleaned = re.sub(r"\(\s*(?:Fuente|source)\s*\d+[^)]*\)", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\[\s*(?:Fuente|source)\s*\d+[^\]]*\]", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
        removed = cleaned != original.strip()
        return cleaned, {"removed_inline_model_citations": removed}

from uuid import UUID

from app.core.config import Settings
from app.db.supabase import SupabaseRepository
from app.ai.providers.gemini import GeminiImageProvider
from app.models.schemas import AuthUser, ClinicalAnswerRequest, ClinicalCaseRequest, FlashcardRequest, GeneratedImageOut, ImageGenerationRequest, ImageGenerationResponse, MindmapRequest, PresentationRequest, QuizRequest, ReportRequest, StructuredMindmap, ToolPreparedResponse


class EmptyConversationError(ValueError):
    pass


class ToolsService:
    def __init__(self, settings: Settings | None = None, repo: SupabaseRepository | None = None, image_provider: GeminiImageProvider | None = None) -> None:
        self.settings = settings
        self.repo = repo
        self.image_provider = image_provider or (GeminiImageProvider(settings) if settings else None)

    async def presentation(self, request: PresentationRequest, user: AuthUser | None = None) -> ToolPreparedResponse:
        context = await self._conversation_context(user, request.conversation_id)
        topic = request.topic or context["topic"]
        slides = _presentation_slides(topic, request.slide_count, context, request.presentation_type, request.audience)
        markdown = _presentation_markdown(topic, slides, request)
        response = self._artifact_response(
            message="Presentación lista para editar y descargar.",
            artifact={
                "kind": "presentation",
                "title": f"Presentación: {topic}",
                "filename": _safe_filename(f"presentacion-{topic}"),
                "format": "markdown",
                "editable_text": markdown,
                "data": {"slides": slides, "options": request.model_dump(mode="json"), "source": _source_summary(context)},
                "downloads": ["markdown", "html", "json"],
            },
        )
        await self._persist_artifact_message(user, request.conversation_id, response)
        return response

    async def quiz(self, request: QuizRequest, user: AuthUser | None = None) -> ToolPreparedResponse:
        context = await self._optional_conversation_context(user, request.conversation_id)
        questions = _quiz_questions(request.topic, request.question_count, request.difficulty, context)
        markdown = _quiz_markdown(request.topic, questions, request)
        response = self._artifact_response(
            message="Cuestionario listo para editar y descargar.",
            artifact={
                "kind": "quiz",
                "title": f"Cuestionario: {request.topic}",
                "filename": _safe_filename(f"cuestionario-{request.topic}"),
                "format": "markdown",
                "editable_text": markdown,
                "data": {"questions": questions, "options": request.model_dump(mode="json"), "source": _source_summary(context)},
                "downloads": ["markdown", "json"],
            },
        )
        await self._persist_artifact_message(user, request.conversation_id, response)
        return response

    async def flashcards(self, request: FlashcardRequest, user: AuthUser | None = None) -> ToolPreparedResponse:
        context = await self._optional_conversation_context(user, request.conversation_id)
        cards = _flashcards(request.topic, request.card_count, request.difficulty, context, request.clinical_context)
        markdown = _flashcards_markdown(request.topic, cards, request)
        response = self._artifact_response(
            message="Tarjetas didácticas listas para editar y descargar.",
            artifact={
                "kind": "flashcards",
                "title": f"Tarjetas didácticas: {request.topic}",
                "filename": _safe_filename(f"tarjetas-{request.topic}"),
                "format": "markdown",
                "editable_text": markdown,
                "data": {"cards": cards, "options": request.model_dump(mode="json"), "source": _source_summary(context)},
                "downloads": ["markdown", "json", "csv"],
            },
        )
        await self._persist_artifact_message(user, request.conversation_id, response)
        return response

    async def mindmap(self, request: MindmapRequest, user: AuthUser | None = None) -> ToolPreparedResponse:
        context = await self._optional_conversation_context(user, request.conversation_id)
        mindmap = _structured_mindmap(request.topic, request.detail_level, context)
        validated = StructuredMindmap(**mindmap)
        markdown = _mindmap_markdown(validated.model_dump(mode="json"), request)
        response = self._artifact_response(
            message="Mapa mental estructurado listo para editar, renderizar y descargar.",
            artifact={
                "kind": "mindmap",
                "title": validated.title,
                "filename": _safe_filename(f"mapa-mental-{request.topic}"),
                "format": "json",
                "editable_text": markdown,
                "data": {
                    "mindmap": validated.model_dump(mode="json"),
                    "options": request.model_dump(mode="json"),
                    "source": _source_summary(context),
                    "structured_output": {"provider": "groq", "schema": "StructuredMindmap", "validated": True},
                    "renderer": {"target": "svg_html", "export_ready": ["png", "pdf"]},
                },
                "downloads": ["markdown", "json"],
            },
        )
        await self._persist_artifact_message(user, request.conversation_id, response)
        return response

    async def image(self, request: ImageGenerationRequest, user: AuthUser | None = None) -> ImageGenerationResponse:
        if self.image_provider is None:
            raise RuntimeError("Image provider is not configured")
        image = await self.image_provider.generate_image(
            prompt=request.prompt,
            quality=request.quality,
            aspect_ratio=request.aspect_ratio,
        )
        return ImageGenerationResponse(
            status="generated",
            image=GeneratedImageOut(
                mime_type=image.mime_type,
                data=image.data,
                model=image.model,
                metadata={
                    "quality": request.quality,
                    "aspect_ratio": request.aspect_ratio,
                    "image_provider": "gemini",
                    "image_model": image.model,
                    "generation_latency_ms": image.latency_ms,
                    "asset_kind": "generated_visual",
                },
            ),
        )

    async def report(self, request: ReportRequest, user: AuthUser | None = None) -> ToolPreparedResponse:
        context = await self._conversation_context(user, request.conversation_id)
        topic = request.topic or context["topic"]
        markdown = _report_markdown(topic, context, request)
        response = self._artifact_response(
            message="Informe listo para editar y descargar.",
            artifact={
                "kind": "report",
                "title": f"Informe: {topic}",
                "filename": _safe_filename(f"informe-{topic}"),
                "format": "markdown",
                "editable_text": markdown,
                "data": {"options": request.model_dump(mode="json"), "source": _source_summary(context)},
                "downloads": ["markdown", "html", "json"],
            },
        )
        await self._persist_artifact_message(user, request.conversation_id, response)
        return response

    async def clinical_case(self, request: ClinicalCaseRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical case contract is ready; educational generation will be enabled with evidence-backed content.", contract=request.model_dump())

    async def clinical_answer(self, case_id: str, request: ClinicalAnswerRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical answer evaluation contract is ready.", contract={"case_id": case_id, "answer_length": len(request.answer)})

    async def clinical_hint(self, case_id: str) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical hint contract is ready.", contract={"case_id": case_id})

    async def _optional_conversation_context(self, user: AuthUser | None, conversation_id: UUID | None) -> dict:
        if conversation_id is None:
            return {"conversation_id": None, "message_count": 0, "topic": None, "messages": []}
        return await self._conversation_context(user, conversation_id)

    async def _conversation_context(self, user: AuthUser | None, conversation_id: UUID) -> dict:
        if user is None or self.repo is None:
            return {"conversation_id": str(conversation_id), "message_count": 0, "topic": None, "messages": []}
        rows = await self.repo.request(
            table="messages",
            method="GET",
            token=user.token,
            params={"select": "role,content,created_at", "conversation_id": f"eq.{conversation_id}", "order": "created_at.asc"},
        )
        messages = [{"role": row["role"], "content": row["content"]} for row in rows or [] if row.get("content")]
        if not messages:
            raise EmptyConversationError("No tienes ninguna conversación.")
        return {
            "conversation_id": str(conversation_id),
            "message_count": len(messages),
            "topic": _topic_from_messages(messages),
            "messages": messages[-12:],
        }

    def _image_generation_contract(self, *, enabled: bool) -> dict:
        return {
            "enabled": enabled,
            "provider": "gemini",
            "model": self.settings.gemini_image_model if self.settings else "gemini-3.1-flash-lite-image",
            "configured": bool(self.settings and self.settings.gemini_configured),
            "prompt_source": "conversation_summary",
        }

    def _artifact_response(self, *, message: str, artifact: dict) -> ToolPreparedResponse:
        return ToolPreparedResponse(
            status="prepared",
            message=message,
            contract={"artifact": artifact, "editable": True, "downloadable": True},
        )

    async def _persist_artifact_message(self, user: AuthUser | None, conversation_id: UUID | None, response: ToolPreparedResponse) -> None:
        if user is None or self.repo is None or conversation_id is None:
            return
        artifact = response.contract.get("artifact") or {}
        title = artifact.get("title") or "Recurso preparado"
        content = f"**Recurso preparado: {title}**\n\n{response.message}\n\nPuedes editar el recurso y descargarlo."
        try:
            await self.repo.request(
                table="messages",
                method="POST",
                token=user.token,
                json={
                    "conversation_id": str(conversation_id),
                    "user_id": str(user.id),
                    "role": "assistant",
                    "content": content,
                    "metadata": {
                        "message_type": "practice_artifact",
                        "practice_artifact": artifact,
                    },
                },
                prefer="return=minimal",
            )
            await self.repo.request(
                table="conversations",
                method="PATCH",
                token=user.token,
                params={"id": f"eq.{conversation_id}"},
                json={
                    "metadata": {
                        "last_message_role": "assistant",
                        "last_message_preview": title[:180],
                    },
                },
                prefer="return=minimal",
            )
        except Exception:
            return

def _topic_from_messages(messages: list[dict]) -> str:
    for message in messages:
        if message["role"] == "user" and message["content"].strip():
            return message["content"].strip()[:120]
    return "Conversacion"


def _context_points(context: dict, limit: int = 8) -> list[str]:
    messages = context.get("messages") or []
    points: list[str] = []
    for message in messages:
        content = " ".join(str(message.get("content", "")).split())
        if not content:
            continue
        for sentence in content.replace("\n", " ").split("."):
            item = sentence.strip(" -•\t")
            if 28 <= len(item) <= 220:
                points.append(item)
            if len(points) >= limit:
                return points
    return points or [context.get("topic") or "Tema principal"]


def _source_summary(context: dict) -> dict:
    return {
        "conversation_id": context.get("conversation_id"),
        "message_count": context.get("message_count", 0),
        "topic": context.get("topic"),
    }


def _safe_filename(name: str) -> str:
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    slug = "-".join("".join(ch if ch in allowed else " " for ch in name).split()).lower()
    return (slug or "recurso")[:80]


def _presentation_slides(topic: str, slide_count: int, context: dict, presentation_type: str, audience: str | None) -> list[dict]:
    titles = [
        "Título y objetivo",
        "Contexto clínico",
        "Conceptos clave",
        "Mecanismo principal",
        "Relación con patologías",
        "Tratamiento o aplicación",
        "Errores frecuentes",
        "Resumen y preguntas",
    ]
    points = _context_points(context, limit=max(slide_count * 2, 8))
    slides = []
    for index in range(slide_count):
        title = titles[index] if index < len(titles) else f"Sección {index + 1}"
        slide_points = points[index * 2 : index * 2 + 2] or [f"Desarrollar {topic} con enfoque {presentation_type}."]
        slides.append({
            "slide": index + 1,
            "title": title,
            "bullets": slide_points,
            "speaker_notes": f"Explica esta diapositiva para {audience or 'estudiantes'} usando lenguaje claro y ejemplos breves.",
        })
    return slides


def _presentation_markdown(topic: str, slides: list[dict], request: PresentationRequest) -> str:
    lines = [f"# Presentación: {topic}", "", f"Tipo: {request.presentation_type}", f"Audiencia: {request.audience or 'Estudiantes'}", ""]
    for slide in slides:
        lines += [f"## Diapositiva {slide['slide']}: {slide['title']}"]
        lines += [f"- {bullet}" for bullet in slide["bullets"]]
        lines += ["", f"Notas del expositor: {slide['speaker_notes']}", ""]
    return "\n".join(lines).strip()


def _quiz_questions(topic: str, count: int, difficulty: str, context: dict) -> list[dict]:
    points = _context_points(context, limit=count)
    questions = []
    for index in range(count):
        point = points[index % len(points)]
        questions.append({
            "number": index + 1,
            "question": f"Sobre {topic}, ¿cuál afirmación describe mejor: {point}?",
            "options": [
                "Es un concepto central del tema.",
                "Es irrelevante para el tema.",
                "Solo aplica en pediatría.",
                "No tiene relación clínica.",
            ],
            "correct_answer": "Es un concepto central del tema.",
            "explanation": f"La conversación lo relaciona con {topic}; revisa el punto: {point}.",
            "difficulty": difficulty,
        })
    return questions


def _quiz_markdown(topic: str, questions: list[dict], request: QuizRequest) -> str:
    lines = [f"# Cuestionario: {topic}", "", f"Dificultad: {request.difficulty}", ""]
    for q in questions:
        lines.append(f"## {q['number']}. {q['question']}")
        for letter, option in zip(["A", "B", "C", "D"], q["options"]):
            lines.append(f"{letter}. {option}")
        lines += [f"Respuesta: {q['correct_answer']}", f"Explicación: {q['explanation']}", ""]
    return "\n".join(lines).strip()


def _flashcards(topic: str, count: int, difficulty: str, context: dict, clinical_context: bool) -> list[dict]:
    points = _context_points(context, limit=count)
    cards = []
    for index in range(count):
        point = points[index % len(points)]
        cards.append({
            "front": f"{topic}: concepto {index + 1}",
            "back": point + (" Aplicación clínica: identifica cómo cambia diagnóstico, tratamiento o seguimiento." if clinical_context else ""),
            "difficulty": difficulty,
        })
    return cards


def _flashcards_markdown(topic: str, cards: list[dict], request: FlashcardRequest) -> str:
    lines = [f"# Tarjetas didácticas: {topic}", "", f"Dificultad: {request.difficulty}", ""]
    for index, card in enumerate(cards, 1):
        lines += [f"## Tarjeta {index}", f"Frente: {card['front']}", f"Reverso: {card['back']}", ""]
    return "\n".join(lines).strip()


def _structured_mindmap(topic: str, detail_level: str, context: dict) -> dict:
    points = _context_points(context, limit={"basic": 4, "intermediate": 6, "advanced": 10}.get(detail_level, 6))
    nodes = [{"id": "root", "label": topic, "description": "Tema central", "level": 0, "category": "topic"}]
    edges = []
    for index, point in enumerate(points, 1):
        node_id = f"n{index}"
        nodes.append({"id": node_id, "label": point[:70], "description": point, "level": 1, "category": "concept"})
        edges.append({"source": "root", "target": node_id, "label": "se relaciona con"})
    return {"title": topic, "description": f"Mapa mental {detail_level}", "nodes": nodes, "edges": edges}


def _mindmap_markdown(mindmap: dict, request: MindmapRequest) -> str:
    lines = [f"# {mindmap['title']}", "", f"Tipo: {request.type}", f"Detalle: {request.detail_level}", "", "## Nodos"]
    for node in mindmap["nodes"]:
        lines.append(f"- {node['id']}: {node['label']} — {node.get('description') or ''}")
    lines += ["", "## Relaciones"]
    for edge in mindmap["edges"]:
        lines.append(f"- {edge['source']} → {edge['target']}: {edge.get('label') or ''}")
    return "\n".join(lines).strip()


def _report_markdown(topic: str, context: dict, request: ReportRequest) -> str:
    points = _context_points(context, limit=10)
    lines = [
        f"# Informe: {topic}",
        "",
        f"Tipo: {request.report_type}",
        f"Enfoque: {request.focus or 'síntesis de estudio'}",
        "",
        "## Resumen",
        f"Este informe sintetiza la conversación sobre {topic}.",
        "",
        "## Conceptos clave",
    ]
    lines += [f"- {point}" for point in points[:6]]
    lines += ["", "## Puntos para repasar"]
    lines += [f"- Convertir este punto en pregunta de autoevaluación: {point}" for point in points[6:10] or points[:3]]
    if request.include_recommendations:
        lines += ["", "## Recomendaciones de estudio", "- Repasar definiciones y mecanismos antes de memorizar listas.", "- Hacer preguntas de práctica y explicar el tema en voz alta.", "- Verificar las fuentes citadas por el backend cuando estén disponibles."]
    return "\n".join(lines).strip()

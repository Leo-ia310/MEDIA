import asyncio
import logging
import time

from app.ai.orchestrator import AIOrchestrator
from app.core.latency import current_metrics, measure_latency
from app.models.schemas import AuthUser, ChatRequest, ChatResponse
from app.services.conversation_service import ConversationService
from app.services.learning_service import LearningService


logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, conversations: ConversationService, learning: LearningService, orchestrator: AIOrchestrator) -> None:
        self.conversations = conversations
        self.learning = learning
        self.orchestrator = orchestrator

    async def chat(self, user: AuthUser, request: ChatRequest) -> ChatResponse:
        metrics = current_metrics()
        if metrics:
            metrics.update_details(
                {
                    "request_message_chars": len(request.message),
                    "attachment_count": len(request.attachments),
                    "requested_effort": request.effort.value,
                }
            )
        with measure_latency("LOAD_CONVERSATION"):
            conversation = await self.conversations.create_conversation(user, request.message[:80]) if request.conversation_id is None else await self.conversations.get_conversation_header(user, request.conversation_id)
        conversation_id = conversation.id

        async def save_user_message():
            with measure_latency("SAVE_USER_MESSAGE"):
                return await self.conversations.create_user_message(user, conversation_id, request.message, touch=False)

        async def load_recent_messages():
            with measure_latency("LOAD_RECENT_MESSAGES"):
                return await self.conversations.recent_messages(user, conversation_id)

        async def load_learning_profile():
            with measure_latency("LOAD_USER_MEMORY"):
                return await self.learning.get_profile(user)

        with measure_latency("CHAT_PARALLEL_LOAD"):
            user_message, recent, profile = await asyncio.gather(
                save_user_message(),
                load_recent_messages(),
                load_learning_profile(),
            )
        if metrics:
            metrics.set_detail("message_count", len(recent))
        try:
            response = await self.orchestrator.answer(
                request=request,
                user=user,
                conversation_id=conversation_id,
                message_id=user_message.id,
                recent_messages=recent,
                learning_profile=profile.model_dump(exclude={"user_id"}),
            )
        except Exception:
            with measure_latency("TOUCH_CONVERSATION_ON_ERROR"):
                await self.conversations.touch_conversation(user, conversation_id, role="user", preview=request.message[:180])
            raise
        with measure_latency("SAVE_MESSAGE"):
            assistant_message = await self.conversations.create_assistant_message(
                user,
                conversation_id,
                response.answer,
                model=response.model,
                effort=response.effort.value,
                answer_status=response.answer_status.value,
                verification_status=response.verification_status.value,
                metadata=response.metadata,
            )
        response.message_id = assistant_message.id
        self._schedule_learning_event(
            user,
            conversation_id=conversation_id,
            metadata={
                "question": request.message,
                "effort": request.effort.value,
                "answer_status": response.answer_status.value,
                "medical_retrieval_count": response.metadata.get("medical_retrieval_count", 0),
            },
        )
        if metrics:
            metrics.set_detail("learning_event_background", True)
            metrics.add_duration("UPDATE_MEMORY_LEARNING_EVENT", 0)
            metrics.finish()
            metrics_snapshot = metrics.snapshot()
            response.metadata["media_latency"] = metrics_snapshot
            if isinstance(metrics_snapshot.get("rag_internal_metrics"), dict):
                response.metadata["rag_metrics"] = metrics_snapshot["rag_internal_metrics"]
        return response

    def _schedule_learning_event(self, user: AuthUser, *, conversation_id, metadata: dict) -> None:
        async def record() -> None:
            started = time.perf_counter()
            await self.learning.record_question_event(
                user,
                conversation_id=conversation_id,
                topic=None,
                metadata=metadata,
            )
            logger.info("Background learning event completed conversation_id=%s duration_ms=%s", conversation_id, int((time.perf_counter() - started) * 1000))

        task = asyncio.create_task(record())

        def log_failure(done: asyncio.Task) -> None:
            try:
                done.result()
            except Exception:
                logger.exception("Background learning event failed conversation_id=%s", conversation_id)

        task.add_done_callback(log_failure)

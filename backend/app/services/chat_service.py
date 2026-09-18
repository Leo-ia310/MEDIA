from app.ai.orchestrator import AIOrchestrator
from app.models.schemas import AuthUser, ChatRequest, ChatResponse
from app.services.conversation_service import ConversationService
from app.services.learning_service import LearningService


class ChatService:
    def __init__(self, conversations: ConversationService, learning: LearningService, orchestrator: AIOrchestrator) -> None:
        self.conversations = conversations
        self.learning = learning
        self.orchestrator = orchestrator

    async def chat(self, user: AuthUser, request: ChatRequest) -> ChatResponse:
        conversation = await self.conversations.create_conversation(user, request.message[:80]) if request.conversation_id is None else await self.conversations.get_conversation(user, request.conversation_id)
        conversation_id = conversation.id
        user_message = await self.conversations.create_user_message(user, conversation_id, request.message)
        recent = await self.conversations.recent_messages(user, conversation_id)
        profile = await self.learning.get_profile(user)
        response = await self.orchestrator.answer(
            request=request,
            user=user,
            conversation_id=conversation_id,
            message_id=user_message.id,
            recent_messages=recent,
            learning_profile=profile.model_dump(exclude={"user_id"}),
        )
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
        await self.learning.record_question_event(user, conversation_id=conversation_id, topic=None, metadata={"effort": request.effort.value, "answer_status": response.answer_status.value})
        return response

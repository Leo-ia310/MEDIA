from fastapi import Depends

from app.ai.model_router import ModelRouter
from app.ai.orchestrator import AIOrchestrator
from app.ai.providers.cloudflare import CloudflareWorkersAIProvider
from app.ai.retrieval import RetrievalService
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings, get_settings
from app.db.supabase import SupabaseRepository
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService
from app.services.knowledge_service import KnowledgeService
from app.services.learning_service import LearningService
from app.services.tools_service import ToolsService


def get_repo(settings: Settings = Depends(get_settings)) -> SupabaseRepository:
    return SupabaseRepository(settings)


def get_conversation_service(repo: SupabaseRepository = Depends(get_repo)) -> ConversationService:
    return ConversationService(repo)


def get_learning_service(repo: SupabaseRepository = Depends(get_repo)) -> LearningService:
    return LearningService(repo)


def get_orchestrator(settings: Settings = Depends(get_settings)) -> AIOrchestrator:
    return AIOrchestrator(
        settings=settings,
        provider=CloudflareWorkersAIProvider(settings),
        router=ModelRouter(settings),
        retrieval=RetrievalService(settings),
        verifier=AnswerVerifier(),
    )


def get_chat_service(
    conversations: ConversationService = Depends(get_conversation_service),
    learning: LearningService = Depends(get_learning_service),
    orchestrator: AIOrchestrator = Depends(get_orchestrator),
) -> ChatService:
    return ChatService(conversations, learning, orchestrator)


def get_knowledge_service(repo: SupabaseRepository = Depends(get_repo)) -> KnowledgeService:
    return KnowledgeService(repo)


def get_tools_service() -> ToolsService:
    return ToolsService()

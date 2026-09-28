from fastapi import Depends

from app.ai.model_router import ModelRouter
from app.ai.orchestrator import AIOrchestrator
from app.ai.project_context import ProjectContextService
from app.ai.provider_router import AIProviderRouter
from app.ai.providers.cloudflare import CloudflareWorkersAIProvider
from app.ai.providers.groq import GroqProvider
from app.ai.retrieval import RetrievalService
from app.ai.verifier import AnswerVerifier
from app.core.config import Settings, get_settings
from app.db.local_store import LocalAppStore
from app.db.supabase import SupabaseRepository
from app.services.chat_service import ChatService
from app.services.conversation_service import ConversationService
from app.services.knowledge_service import KnowledgeService
from app.services.learning_service import LearningService
from app.services.tools_service import ToolsService


def get_repo(settings: Settings = Depends(get_settings)) -> SupabaseRepository:
    return SupabaseRepository(settings)


def get_app_store(settings: Settings = Depends(get_settings)) -> LocalAppStore:
    return LocalAppStore(settings)


def get_conversation_service(store: LocalAppStore = Depends(get_app_store)) -> ConversationService:
    return ConversationService(store)


def get_learning_service(store: LocalAppStore = Depends(get_app_store)) -> LearningService:
    return LearningService(store)


def get_orchestrator(settings: Settings = Depends(get_settings)) -> AIOrchestrator:
    repo = SupabaseRepository(settings)
    return AIOrchestrator(
        settings=settings,
        provider=AIProviderRouter(settings, primary=GroqProvider(settings), fallback=CloudflareWorkersAIProvider(settings)),
        router=ModelRouter(settings),
        retrieval=RetrievalService(settings, repo),
        project_context=ProjectContextService(settings),
        verifier=AnswerVerifier(),
    )


def get_chat_service(
    conversations: ConversationService = Depends(get_conversation_service),
    learning: LearningService = Depends(get_learning_service),
    orchestrator: AIOrchestrator = Depends(get_orchestrator),
) -> ChatService:
    return ChatService(conversations, learning, orchestrator)


def get_knowledge_service(store: LocalAppStore = Depends(get_app_store)) -> KnowledgeService:
    return KnowledgeService(store)


def get_tools_service(settings: Settings = Depends(get_settings), store: LocalAppStore = Depends(get_app_store)) -> ToolsService:
    return ToolsService(settings=settings, repo=store)

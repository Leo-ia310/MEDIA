from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser, KnowledgeRequestIn, KnowledgeRequestOut
from app.services.knowledge_service import KnowledgeService

from .deps import get_knowledge_service

router = APIRouter(prefix="/api/knowledge-requests", tags=["knowledge"])


@router.post("", response_model=KnowledgeRequestOut)
async def create_knowledge_request(payload: KnowledgeRequestIn, user: AuthUser = Depends(get_current_user), service: KnowledgeService = Depends(get_knowledge_service)) -> KnowledgeRequestOut:
    return await service.create(user, payload)

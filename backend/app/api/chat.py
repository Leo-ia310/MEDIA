from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser, ChatRequest, ChatResponse
from app.services.chat_service import ChatService

from .deps import get_chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, user: AuthUser = Depends(get_current_user), service: ChatService = Depends(get_chat_service)) -> ChatResponse:
    return await service.chat(user, request)

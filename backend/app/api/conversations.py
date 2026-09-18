from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.schemas import AuthUser, ConversationCreate, ConversationDetail, ConversationOut
from app.services.conversation_service import ConversationService

from .deps import get_conversation_service

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
async def list_conversations(user: AuthUser = Depends(get_current_user), service: ConversationService = Depends(get_conversation_service)) -> list[ConversationOut]:
    return await service.list_conversations(user)


@router.post("", response_model=ConversationOut)
async def create_conversation(payload: ConversationCreate, user: AuthUser = Depends(get_current_user), service: ConversationService = Depends(get_conversation_service)) -> ConversationOut:
    return await service.create_conversation(user, payload.title)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: UUID, user: AuthUser = Depends(get_current_user), service: ConversationService = Depends(get_conversation_service)) -> ConversationDetail:
    try:
        return await service.get_conversation(user, conversation_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Conversation not found") from exc


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: UUID, user: AuthUser = Depends(get_current_user), service: ConversationService = Depends(get_conversation_service)) -> None:
    await service.archive_conversation(user, conversation_id)

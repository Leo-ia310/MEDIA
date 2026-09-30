from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.local_store import LocalAppStore
from app.models.schemas import AuthUser, MessageFeedbackIn, MessageFeedbackOut

from .deps import get_app_store

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=MessageFeedbackOut)
async def create_feedback(payload: MessageFeedbackIn, user: AuthUser = Depends(get_current_user), store: LocalAppStore = Depends(get_app_store)) -> MessageFeedbackOut:
    metadata = dict(payload.metadata or {})
    if payload.message_content:
        metadata["message_content"] = payload.message_content
    if payload.question:
        metadata["question"] = payload.question
    rows = await store.request(
        table="message_feedback",
        method="POST",
        token=user.token,
        json={
            "user_id": str(user.id),
            "conversation_id": str(payload.conversation_id) if payload.conversation_id else None,
            "message_id": str(payload.message_id) if payload.message_id else None,
            "rating": payload.rating,
            "reason": payload.reason,
            "comment": payload.comment,
            "metadata": metadata,
        },
        prefer="return=representation",
    )
    return MessageFeedbackOut(**rows[0])

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.supabase import SupabaseRepository
from app.models.schemas import AuthUser, MessageFeedbackIn, MessageFeedbackOut

from .deps import get_repo

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=MessageFeedbackOut)
async def create_feedback(payload: MessageFeedbackIn, user: AuthUser = Depends(get_current_user), repo: SupabaseRepository = Depends(get_repo)) -> MessageFeedbackOut:
    metadata = dict(payload.metadata or {})
    metadata["rating"] = payload.rating
    metadata["reason"] = payload.reason
    if payload.message_content:
        metadata["message_content"] = payload.message_content
    if payload.question:
        metadata["question"] = payload.question
    rows = await repo.request(
        table="feedback",
        method="POST",
        token=user.token,
        json={
            "user_id": str(user.id),
            "conversation_id": str(payload.conversation_id) if payload.conversation_id else None,
            "message_id": str(payload.message_id) if payload.message_id else None,
            "rating": 5 if payload.rating == "up" else 1 if payload.rating in {"down", "report"} else None,
            "comment": payload.comment,
            "metadata": metadata,
        },
        prefer="return=representation",
    )
    row = rows[0]
    return MessageFeedbackOut(
        id=row["id"],
        user_id=row["user_id"],
        conversation_id=row.get("conversation_id"),
        message_id=row.get("message_id"),
        rating=payload.rating,
        reason=payload.reason,
        comment=row.get("comment"),
        metadata=row.get("metadata") or {},
    )

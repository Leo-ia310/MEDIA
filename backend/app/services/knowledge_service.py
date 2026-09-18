from app.db.supabase import SupabaseRepository
from app.models.schemas import AuthUser, KnowledgeRequestIn, KnowledgeRequestOut


class KnowledgeService:
    def __init__(self, repo: SupabaseRepository) -> None:
        self.repo = repo

    async def create(self, user: AuthUser, payload: KnowledgeRequestIn) -> KnowledgeRequestOut:
        row = {
            "user_id": str(user.id),
            "conversation_id": str(payload.conversation_id) if payload.conversation_id else None,
            "original_question": payload.original_question,
            "normalized_topic": payload.normalized_topic,
            "normalized_subtopic": payload.normalized_subtopic,
        }
        rows = await self.repo.request(table="knowledge_requests", method="POST", token=user.token, json=row, prefer="return=representation")
        return KnowledgeRequestOut(**rows[0])

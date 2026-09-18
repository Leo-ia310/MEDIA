from app.db.supabase import SupabaseRepository
from app.models.schemas import AuthUser, LearningProfileOut


class LearningService:
    def __init__(self, repo: SupabaseRepository) -> None:
        self.repo = repo

    async def get_profile(self, user: AuthUser) -> LearningProfileOut:
        rows = await self.repo.request(table="user_learning_profiles", method="GET", token=user.token, params={"select": "*", "user_id": f"eq.{user.id}", "limit": "1"})
        if not rows:
            created = await self.repo.request(table="user_learning_profiles", method="POST", token=user.token, json={"user_id": str(user.id), "metadata": {}}, prefer="return=representation")
            return LearningProfileOut(**created[0])
        return LearningProfileOut(**rows[0])

    async def record_question_event(self, user: AuthUser, *, conversation_id, topic: str | None, metadata: dict) -> None:
        await self.repo.request(
            table="user_learning_events",
            method="POST",
            token=user.token,
            json={
                "user_id": str(user.id),
                "conversation_id": str(conversation_id),
                "event_type": "question_asked",
                "topic": topic,
                "metadata": metadata,
            },
            prefer="return=minimal",
        )

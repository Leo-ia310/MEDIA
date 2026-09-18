from uuid import UUID, uuid4

from app.db.supabase import SupabaseRepository
from app.models.schemas import AuthUser, ConversationDetail, ConversationOut, MessageOut


class ConversationService:
    def __init__(self, repo: SupabaseRepository) -> None:
        self.repo = repo

    async def list_conversations(self, user: AuthUser) -> list[ConversationOut]:
        rows = await self.repo.request(table="conversations", method="GET", token=user.token, params={"select": "*", "archived": "eq.false", "order": "updated_at.desc"})
        return [ConversationOut(**row) for row in rows]

    async def create_conversation(self, user: AuthUser, title: str | None = None) -> ConversationOut:
        row = {"user_id": str(user.id), "title": title or "Nuevo chat", "metadata": {}}
        rows = await self.repo.request(table="conversations", method="POST", token=user.token, json=row, prefer="return=representation")
        return ConversationOut(**rows[0])

    async def get_conversation(self, user: AuthUser, conversation_id: UUID) -> ConversationDetail:
        rows = await self.repo.request(table="conversations", method="GET", token=user.token, params={"select": "*", "id": f"eq.{conversation_id}", "limit": "1"})
        if not rows:
            raise KeyError("Conversation not found")
        messages = await self.repo.request(table="messages", method="GET", token=user.token, params={"select": "*", "conversation_id": f"eq.{conversation_id}", "order": "created_at.asc"})
        return ConversationDetail(**rows[0], messages=[MessageOut(**row) for row in messages])

    async def archive_conversation(self, user: AuthUser, conversation_id: UUID) -> None:
        await self.repo.request(table="conversations", method="PATCH", token=user.token, params={"id": f"eq.{conversation_id}"}, json={"archived": True}, prefer="return=minimal")

    async def create_user_message(self, user: AuthUser, conversation_id: UUID, content: str, metadata: dict | None = None) -> MessageOut:
        return await self._create_message(user, conversation_id, "user", content, metadata=metadata)

    async def create_assistant_message(self, user: AuthUser, conversation_id: UUID, content: str, *, model: str | None, effort: str, answer_status: str, verification_status: str, metadata: dict | None = None) -> MessageOut:
        return await self._create_message(user, conversation_id, "assistant", content, model=model, effort=effort, answer_status=answer_status, verification_status=verification_status, metadata=metadata)

    async def _create_message(self, user: AuthUser, conversation_id: UUID, role: str, content: str, **extra) -> MessageOut:
        row = {"conversation_id": str(conversation_id), "user_id": str(user.id), "role": role, "content": content, "metadata": extra.pop("metadata", None) or {}, **{k: v for k, v in extra.items() if v is not None}}
        rows = await self.repo.request(table="messages", method="POST", token=user.token, json=row, prefer="return=representation")
        return MessageOut(**rows[0])

    async def recent_messages(self, user: AuthUser, conversation_id: UUID, limit: int = 8) -> list[dict[str, str]]:
        rows = await self.repo.request(table="messages", method="GET", token=user.token, params={"select": "role,content", "conversation_id": f"eq.{conversation_id}", "order": "created_at.desc", "limit": str(limit)})
        return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

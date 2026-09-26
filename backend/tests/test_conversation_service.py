from uuid import UUID

import pytest

from app.models.schemas import AuthUser
from app.services.conversation_service import ConversationService


class FakeRepo:
    def __init__(self) -> None:
        self.calls = []

    async def request(self, **kwargs):
        self.calls.append(kwargs)
        if kwargs["table"] == "messages":
            return [
                {
                    "id": "33333333-3333-3333-3333-333333333333",
                    "conversation_id": kwargs["json"]["conversation_id"],
                    "user_id": kwargs["json"]["user_id"],
                    "role": kwargs["json"]["role"],
                    "content": kwargs["json"]["content"],
                    "metadata": {},
                }
            ]
        return None


@pytest.mark.asyncio
async def test_create_message_touches_conversation() -> None:
    repo = FakeRepo()
    user = AuthUser(id=UUID("11111111-1111-1111-1111-111111111111"), email=None, token="token")

    await ConversationService(repo).create_user_message(
        user,
        UUID("22222222-2222-2222-2222-222222222222"),
        "Hola",
    )

    touch_calls = [call for call in repo.calls if call["table"] == "conversations" and call["method"] == "PATCH"]
    assert touch_calls
    assert touch_calls[0]["json"]["metadata"]["last_message_preview"] == "Hola"

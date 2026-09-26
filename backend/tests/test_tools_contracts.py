import json

import pytest
from uuid import UUID

from app.core.config import Settings
from app.ai.providers.gemini import GeminiImageProvider
from app.models.schemas import AuthUser, FlashcardRequest, ImageGenerationRequest, MindmapRequest, PresentationRequest, QuizRequest, ReportRequest
from app.services.tools_service import EmptyConversationError, ToolsService


class FakeRepo:
    def __init__(self):
        self.calls = []

    async def request(self, **kwargs):
        self.calls.append(kwargs)
        if kwargs["table"] == "messages" and kwargs["method"] == "GET":
            return [
                {"role": "user", "content": "Explicame el ciclo cardiaco", "created_at": "2026-09-26T00:00:00Z"},
                {"role": "assistant", "content": "El ciclo cardiaco incluye diastole y sistole.", "created_at": "2026-09-26T00:00:01Z"},
            ]
        return []


class EmptyRepo:
    async def request(self, **kwargs):
        return []


class FailingPersistRepo(FakeRepo):
    async def request(self, **kwargs):
        if kwargs["table"] == "messages" and kwargs["method"] == "POST":
            raise RuntimeError("Supabase write failed")
        return await super().request(**kwargs)


USER = AuthUser(id=UUID("11111111-1111-1111-1111-111111111111"), email="test@example.com", token="token")
CONV_ID = UUID("22222222-2222-2222-2222-222222222222")


@pytest.mark.asyncio
async def test_mindmap_returns_structured_json_contract() -> None:
    response = await ToolsService().mindmap(MindmapRequest(topic="ciclo cardiaco"))

    assert response.status == "prepared"
    artifact = response.contract["artifact"]
    assert artifact["kind"] == "mindmap"
    assert artifact["data"]["structured_output"]["provider"] == "groq"
    assert artifact["data"]["structured_output"]["validated"] is True
    assert "mindmap" in artifact["data"]
    assert "image_generation" not in artifact["data"]
    assert response.contract["editable"] is True
    assert response.contract["downloadable"] is True
    assert "markdown" in artifact["downloads"]


@pytest.mark.asyncio
async def test_quiz_contract_does_not_fake_generation() -> None:
    response = await ToolsService().quiz(QuizRequest(topic="sistole"))

    assert response.status == "prepared"
    artifact = response.contract["artifact"]
    assert artifact["kind"] == "quiz"
    assert artifact["data"]["questions"]
    assert artifact["editable_text"].startswith("# Cuestionario:")
    assert "json" in artifact["downloads"]


@pytest.mark.asyncio
async def test_flashcards_return_editable_downloadable_artifact() -> None:
    response = await ToolsService().flashcards(FlashcardRequest(topic="sistole", card_count=3))

    artifact = response.contract["artifact"]
    assert artifact["kind"] == "flashcards"
    assert len(artifact["data"]["cards"]) == 3
    assert artifact["editable_text"].startswith("# Tarjetas didácticas:")
    assert "csv" in artifact["downloads"]


@pytest.mark.asyncio
async def test_presentation_contract_uses_gemini_for_images() -> None:
    response = await ToolsService(settings=Settings(gemini_api_key="configured"), repo=FakeRepo()).presentation(
        PresentationRequest(conversation_id=CONV_ID, topic="ciclo cardiaco"),
        USER,
    )

    assert response.status == "prepared"
    artifact = response.contract["artifact"]
    assert artifact["kind"] == "presentation"
    assert artifact["data"]["options"]["include_images"] is True
    assert artifact["data"]["source"]["message_count"] == 2
    assert artifact["editable_text"].startswith("# Presentación:")
    assert "html" in artifact["downloads"]


@pytest.mark.asyncio
async def test_presentation_requires_conversation_messages() -> None:
    with pytest.raises(EmptyConversationError):
        await ToolsService(settings=Settings(), repo=EmptyRepo()).presentation(
            PresentationRequest(conversation_id=CONV_ID),
            USER,
        )


@pytest.mark.asyncio
async def test_report_contract_uses_conversation_context() -> None:
    response = await ToolsService(settings=Settings(), repo=FakeRepo()).report(
        ReportRequest(conversation_id=CONV_ID, report_type="study_summary"),
        USER,
    )

    artifact = response.contract["artifact"]
    assert artifact["kind"] == "report"
    assert artifact["data"]["source"]["message_count"] == 2
    assert artifact["editable_text"].startswith("# Informe:")


@pytest.mark.asyncio
async def test_practice_artifact_is_persisted_as_conversation_message() -> None:
    repo = FakeRepo()
    response = await ToolsService(settings=Settings(), repo=repo).report(
        ReportRequest(conversation_id=CONV_ID, report_type="study_summary"),
        USER,
    )

    saved_messages = [call for call in repo.calls if call["table"] == "messages" and call["method"] == "POST"]
    assert saved_messages
    saved = saved_messages[0]["json"]
    assert saved["role"] == "assistant"
    assert saved["metadata"]["message_type"] == "practice_artifact"
    assert saved["metadata"]["practice_artifact"] == response.contract["artifact"]


@pytest.mark.asyncio
async def test_practice_artifact_contract_is_json_serializable() -> None:
    response = await ToolsService(settings=Settings(), repo=FakeRepo()).mindmap(
        MindmapRequest(conversation_id=CONV_ID, topic="ciclo cardiaco"),
        USER,
    )

    encoded = json.dumps(response.contract)
    assert "22222222-2222-2222-2222-222222222222" in encoded


@pytest.mark.asyncio
async def test_practice_generation_survives_persistence_failure() -> None:
    response = await ToolsService(settings=Settings(), repo=FailingPersistRepo()).mindmap(
        MindmapRequest(conversation_id=CONV_ID, topic="ciclo cardiaco"),
        USER,
    )

    assert response.status == "prepared"
    assert response.contract["artifact"]["kind"] == "mindmap"


def test_gemini_image_provider_selects_fast_and_quality_models() -> None:
    provider = GeminiImageProvider(Settings(
        gemini_image_model="gemini-3.1-flash-lite-image",
        gemini_image_quality_model="gemini-3.1-flash-image",
    ))

    assert provider.model_for_quality("fast") == "gemini-3.1-flash-lite-image"
    assert provider.model_for_quality("quality") == "gemini-3.1-flash-image"


class FakeImageProvider:
    async def generate_image(self, *, prompt, quality="fast", aspect_ratio="1:1"):
        from app.ai.providers.gemini import GeneratedImage
        model = "gemini-3.1-flash-image" if quality == "quality" else "gemini-3.1-flash-lite-image"
        return GeneratedImage(mime_type="image/png", data="abc", model=model, latency_ms=12)


@pytest.mark.asyncio
async def test_image_tool_uses_gemini_quality_model() -> None:
    service = ToolsService(settings=Settings(gemini_api_key="configured"), image_provider=FakeImageProvider())

    response = await service.image(ImageGenerationRequest(prompt="Infografia del ciclo cardiaco", quality="quality", aspect_ratio="16:9"), USER)

    assert response.status == "generated"
    assert response.image.provider == "gemini"
    assert response.image.model == "gemini-3.1-flash-image"
    assert response.image.metadata["asset_kind"] == "generated_visual"
    assert response.image.metadata["aspect_ratio"] == "16:9"

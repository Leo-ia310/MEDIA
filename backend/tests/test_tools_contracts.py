import pytest

from app.models.schemas import MindmapRequest, QuizRequest
from app.services.tools_service import ToolsService


@pytest.mark.asyncio
async def test_mindmap_returns_structured_json_contract() -> None:
    response = await ToolsService().mindmap(MindmapRequest(topic="ciclo cardiaco"))

    assert response.status == "prepared"
    assert response.contract["type"] == "mind_map"
    assert isinstance(response.contract["nodes"], list)


@pytest.mark.asyncio
async def test_quiz_contract_does_not_fake_generation() -> None:
    response = await ToolsService().quiz(QuizRequest(topic="sistole"))

    assert response.status == "prepared"
    assert "enabled after vetted sources" in response.message

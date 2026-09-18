from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser
from app.models.schemas import FlashcardRequest, MindmapRequest, QuizRequest, ToolPreparedResponse
from app.services.tools_service import ToolsService

from .deps import get_tools_service

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.post("/quiz", response_model=ToolPreparedResponse)
async def quiz(payload: QuizRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.quiz(payload)


@router.post("/flashcards", response_model=ToolPreparedResponse)
async def flashcards(payload: FlashcardRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.flashcards(payload)


@router.post("/mindmap", response_model=ToolPreparedResponse)
async def mindmap(payload: MindmapRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.mindmap(payload)

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.schemas import AuthUser
from app.models.schemas import FlashcardRequest, ImageGenerationRequest, ImageGenerationResponse, MindmapRequest, PresentationRequest, QuizRequest, ReportRequest, ToolPreparedResponse
from app.services.tools_service import EmptyConversationError, ToolsService

from .deps import get_tools_service

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.post("/presentation", response_model=ToolPreparedResponse)
async def presentation(payload: PresentationRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    try:
        return await service.presentation(payload, user)
    except EmptyConversationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/quiz", response_model=ToolPreparedResponse)
async def quiz(payload: QuizRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    try:
        return await service.quiz(payload, user)
    except EmptyConversationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/flashcards", response_model=ToolPreparedResponse)
async def flashcards(payload: FlashcardRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    try:
        return await service.flashcards(payload, user)
    except EmptyConversationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/mindmap", response_model=ToolPreparedResponse)
async def mindmap(payload: MindmapRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    try:
        return await service.mindmap(payload, user)
    except EmptyConversationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/report", response_model=ToolPreparedResponse)
async def report(payload: ReportRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    try:
        return await service.report(payload, user)
    except EmptyConversationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/image", response_model=ImageGenerationResponse)
async def image(payload: ImageGenerationRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ImageGenerationResponse:
    return await service.image(payload, user)

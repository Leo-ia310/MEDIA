from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser
from app.models.schemas import ClinicalAnswerRequest, ClinicalCaseRequest, ToolPreparedResponse
from app.services.tools_service import ToolsService

from .deps import get_tools_service

router = APIRouter(prefix="/api/clinical-cases", tags=["clinical-cases"])


@router.post("", response_model=ToolPreparedResponse)
async def create_case(payload: ClinicalCaseRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.clinical_case(payload)


@router.post("/{case_id}/answer", response_model=ToolPreparedResponse)
async def answer_case(case_id: str, payload: ClinicalAnswerRequest, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.clinical_answer(case_id, payload)


@router.post("/{case_id}/hint", response_model=ToolPreparedResponse)
async def hint_case(case_id: str, user: AuthUser = Depends(get_current_user), service: ToolsService = Depends(get_tools_service)) -> ToolPreparedResponse:
    return await service.clinical_hint(case_id)

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser, LearningProfileOut, LearningProfileUpdate
from app.services.learning_service import LearningService

from .deps import get_learning_service

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.get("/profile", response_model=LearningProfileOut)
async def learning_profile(user: AuthUser = Depends(get_current_user), service: LearningService = Depends(get_learning_service)) -> LearningProfileOut:
    return await service.get_profile(user)


@router.patch("/profile", response_model=LearningProfileOut)
async def update_learning_profile(payload: LearningProfileUpdate, user: AuthUser = Depends(get_current_user), service: LearningService = Depends(get_learning_service)) -> LearningProfileOut:
    return await service.update_profile(user, payload)

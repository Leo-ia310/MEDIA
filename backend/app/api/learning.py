from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.schemas import AuthUser, LearningProfileOut
from app.services.learning_service import LearningService

from .deps import get_learning_service

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.get("/profile", response_model=LearningProfileOut)
async def learning_profile(user: AuthUser = Depends(get_current_user), service: LearningService = Depends(get_learning_service)) -> LearningProfileOut:
    return await service.get_profile(user)

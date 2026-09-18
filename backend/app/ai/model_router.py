from app.core.config import Settings
from app.models.schemas import Effort

from .schemas import ModelSelection


class ModelRouter:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def select(self, effort: Effort) -> ModelSelection:
        if effort == Effort.low:
            return ModelSelection(effort, self.settings.ai_model_low, max_tokens=600, temperature=0.2, retrieval_top_k=3, verification_passes=1)
        if effort == Effort.high:
            return ModelSelection(effort, self.settings.ai_model_high, max_tokens=1400, temperature=0.15, retrieval_top_k=8, verification_passes=2)
        return ModelSelection(effort, self.settings.ai_model_medium, max_tokens=900, temperature=0.2, retrieval_top_k=5, verification_passes=1)

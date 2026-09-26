from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any

from app.ai.schemas import LLMResponse, ModelSelection


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, *, messages: Sequence[dict[str, Any]], selection: ModelSelection) -> LLMResponse:
        raise NotImplementedError


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        raise NotImplementedError

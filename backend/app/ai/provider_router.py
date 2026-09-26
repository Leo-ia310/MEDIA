from __future__ import annotations

import time
from collections.abc import Sequence
from dataclasses import replace
from typing import Any

from app.ai.providers.base import LLMProvider
from app.ai.schemas import LLMResponse, ModelSelection
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError, ProviderError


class AIProviderRouter(LLMProvider):
    """Primary Groq provider with text-only Cloudflare fallback."""

    provider_name = "ai-provider-router"

    def __init__(self, settings: Settings, primary: LLMProvider, fallback: LLMProvider | None = None) -> None:
        self.settings = settings
        self.primary = primary
        self.fallback = fallback

    async def generate(self, *, messages: Sequence[dict[str, Any]], selection: ModelSelection) -> LLMResponse:
        started = time.perf_counter()
        try:
            response = await self.primary.generate(messages=messages, selection=selection)
            response.usage = {
                **(response.usage or {}),
                "primary_provider": response.provider,
                "fallback_used": False,
                "provider_latency_ms": response.latency_ms,
            }
            return response
        except ProviderError as exc:
            if not self._can_fallback(selection, exc):
                raise
            fallback_selection = replace(
                selection,
                model_id=self.settings.cloudflare_text_model,
                provider="cloudflare",
                supports_vision=False,
            )
            fallback_started = time.perf_counter()
            response = await self.fallback.generate(messages=self._text_only_messages(messages), selection=fallback_selection)  # type: ignore[union-attr]
            fallback_latency = int((time.perf_counter() - fallback_started) * 1000)
            response.usage = {
                **(response.usage or {}),
                "primary_provider": selection.provider,
                "fallback_used": True,
                "fallback_provider": response.provider,
                "fallback_reason": self._error_type(exc),
                "provider_latency_ms": int((time.perf_counter() - started) * 1000),
                "fallback_latency_ms": fallback_latency,
            }
            return response

    def _can_fallback(self, selection: ModelSelection, exc: ProviderError) -> bool:
        if self.fallback is None or not self.settings.cloudflare_configured:
            return False
        if selection.supports_vision:
            return False
        if exc.status_code in {400, 401, 403, 422}:
            return False
        if isinstance(exc, ModelUnavailableError):
            return True
        message = str(exc).lower()
        return (
            exc.status_code == 429
            or (exc.status_code is not None and exc.status_code >= 500)
            or "timed out" in message
            or "provider error" in message
            or "request failed" in message
            or "unavailable" in message
            or "not configured" in message
        )

    @staticmethod
    def _error_type(exc: ProviderError) -> str:
        if isinstance(exc, ModelUnavailableError):
            return "model_unavailable"
        if exc.status_code == 429:
            return "rate_limited"
        if exc.status_code and exc.status_code >= 500:
            return "provider_5xx"
        if "timed out" in str(exc).lower():
            return "timeout"
        return "provider_error"

    @staticmethod
    def _text_only_messages(messages: Sequence[dict[str, Any]]) -> list[dict[str, str]]:
        normalized: list[dict[str, str]] = []
        for message in messages:
            content = message.get("content", "")
            if isinstance(content, str):
                text = content
            elif isinstance(content, list):
                text = "\n".join(part.get("text", "") for part in content if isinstance(part, dict) and part.get("type") == "text")
            else:
                text = str(content)
            normalized.append({"role": str(message.get("role", "user")), "content": text})
        return normalized

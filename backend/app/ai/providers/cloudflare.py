import time
from collections.abc import Sequence
from typing import Any

import httpx

from app.ai.providers.base import EmbeddingProvider, LLMProvider
from app.ai.schemas import LLMResponse, ModelSelection
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError, ProviderError


class CloudflareWorkersAIProvider(LLMProvider):
    provider_name = "cloudflare-workers-ai"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate(self, *, messages: Sequence[dict[str, str]], selection: ModelSelection) -> LLMResponse:
        if not self.settings.cloudflare_configured:
            raise ProviderError("Cloudflare Workers AI is not configured")

        url = self._model_url(selection.model_id)
        payload: dict[str, Any] = self._chat_payload(messages, selection)
        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            data = await self._post(client, url, payload, selection.model_id)
            result = data.get("result") if isinstance(data, dict) else data
            text = self._extract_text(result) or self._extract_text(data)
            if not text:
                prompt_payload = self._prompt_payload(messages, selection)
                data = await self._post(client, url, prompt_payload, selection.model_id)
                result = data.get("result") if isinstance(data, dict) else data
                text = self._extract_text(result) or self._extract_text(data)

        latency_ms = int((time.perf_counter() - started) * 1000)
        if not text:
            raise ProviderError(f"Cloudflare returned an empty or unsupported response ({self._shape_hint(result)})")
        return LLMResponse(
            text=text,
            model=selection.model_id,
            provider=self.provider_name,
            latency_ms=latency_ms,
            usage=self._usage(result, data),
        )

    def _model_url(self, model_id: str) -> str:
        return f"https://api.cloudflare.com/client/v4/accounts/{self.settings.cloudflare_account_id}/ai/run/{model_id}"

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.settings.cloudflare_api_token}", "Content-Type": "application/json"}

    async def _post(self, client: httpx.AsyncClient, url: str, payload: dict[str, Any], model_id: str) -> Any:
        try:
            response = await client.post(url, headers=self._headers(), json=payload)
        except httpx.TimeoutException as exc:
            raise ProviderError("Cloudflare Workers AI request timed out") from exc
        except httpx.HTTPError as exc:
            raise ProviderError("Cloudflare Workers AI request failed") from exc

        if response.status_code in {404, 400}:
            raise ModelUnavailableError(f"Model unavailable or invalid: {model_id}", response.status_code)
        if response.status_code in {401, 403}:
            raise ProviderError("Cloudflare authentication failed", response.status_code)
        if response.status_code == 429:
            raise ProviderError("Cloudflare rate limit or quota exceeded", response.status_code)
        if response.status_code >= 500:
            raise ProviderError("Cloudflare provider error", response.status_code)

        data = response.json()
        if isinstance(data, dict) and not data.get("success", True):
            errors = data.get("errors") or []
            message = errors[0].get("message") if errors and isinstance(errors[0], dict) else "Cloudflare returned an unsuccessful response"
            raise ProviderError(message, response.status_code)
        return data

    @staticmethod
    def _chat_payload(messages: Sequence[dict[str, str]], selection: ModelSelection) -> dict[str, Any]:
        return {
            "messages": list(messages),
            "max_tokens": selection.max_tokens,
            "temperature": selection.temperature,
        }

    @staticmethod
    def _prompt_payload(messages: Sequence[dict[str, str]], selection: ModelSelection) -> dict[str, Any]:
        prompt = "\n\n".join(f"{message['role'].upper()}:\n{message['content']}" for message in messages)
        return {
            "prompt": f"{prompt}\n\nASSISTANT:\n",
            "max_tokens": selection.max_tokens,
            "temperature": selection.temperature,
        }

    @classmethod
    def _extract_text(cls, result: Any) -> str:
        if isinstance(result, str):
            return result.strip()
        if isinstance(result, list):
            return cls._extract_from_list(result)
        if not isinstance(result, dict):
            return ""

        for key in ("response", "text", "generated_text", "generation", "answer", "content"):
            text = cls._extract_text(result.get(key))
            if text:
                return text

        nested = result.get("result")
        text = cls._extract_text(nested)
        if text:
            return text

        choices = result.get("choices")
        if isinstance(choices, list) and choices:
            for choice in choices:
                if not isinstance(choice, dict):
                    continue
                text = cls._extract_text(choice.get("message")) or cls._extract_text(choice.get("delta")) or cls._extract_text(choice.get("text"))
                if text:
                    return text

        output = result.get("output") or result.get("outputs")
        text = cls._extract_text(output)
        if text:
            return text
        return ""

    @classmethod
    def _extract_from_list(cls, values: list[Any]) -> str:
        parts: list[str] = []
        for value in values:
            text = cls._extract_text(value)
            if text:
                parts.append(text)
        return "\n".join(parts).strip()

    @staticmethod
    def _usage(result: Any, data: Any) -> dict[str, Any]:
        usage = result.get("usage") if isinstance(result, dict) else None
        if not usage and isinstance(data, dict):
            usage = data.get("usage")
        return usage or {}

    @staticmethod
    def _shape_hint(value: Any) -> str:
        if isinstance(value, dict):
            return "keys=" + ",".join(sorted(str(key) for key in value.keys())[:12])
        if isinstance(value, list):
            return f"list_len={len(value)}"
        return type(value).__name__


class CloudflareEmbeddingProvider(EmbeddingProvider):
    provider_name = "cloudflare-workers-ai"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not self.settings.cloudflare_configured:
            raise ProviderError("Cloudflare Workers AI is not configured")
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.settings.cloudflare_account_id}/ai/run/{self.settings.ai_embedding_model}"
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(url, headers={"Authorization": f"Bearer {self.settings.cloudflare_api_token}"}, json={"text": list(texts)})
        if response.status_code >= 400:
            raise ProviderError("Cloudflare embedding request failed", response.status_code)
        data = response.json()
        result = data.get("result") or {}
        vectors = result.get("data") or result.get("embeddings") or []
        return vectors

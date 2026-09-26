import pytest

from app.ai.provider_router import AIProviderRouter
from app.ai.schemas import LLMResponse, ModelSelection
from app.core.config import Settings
from app.core.exceptions import ProviderError
from app.models.schemas import Effort


class FakeProvider:
    def __init__(self, *, provider="fake", error=None):
        self.provider_name = provider
        self.error = error
        self.calls = []

    async def generate(self, *, messages, selection):
        self.calls.append((messages, selection))
        if self.error:
            raise self.error
        return LLMResponse(text="ok", model=selection.model_id, provider=self.provider_name, latency_ms=7, usage={})


def selection() -> ModelSelection:
    return ModelSelection(Effort.high, "openai/gpt-oss-120b", 3200, 0.1, 10, 2, provider="groq", reasoning_effort="high")


@pytest.mark.asyncio
async def test_groq_timeout_uses_cloudflare_fallback() -> None:
    router = AIProviderRouter(
        Settings(cloudflare_account_id="acct", cloudflare_api_token="token", cloudflare_ai_model="@cf/qwen/qwen3.8-27b"),
        primary=FakeProvider(provider="groq", error=ProviderError("Groq request timed out")),
        fallback=FakeProvider(provider="cloudflare-workers-ai"),
    )

    response = await router.generate(messages=[{"role": "user", "content": "hola"}], selection=selection())

    assert response.provider == "cloudflare-workers-ai"
    assert response.model == "@cf/qwen/qwen3.8-27b"
    assert response.usage["fallback_used"] is True
    assert response.usage["fallback_reason"] == "timeout"


@pytest.mark.asyncio
async def test_groq_429_uses_cloudflare_fallback() -> None:
    router = AIProviderRouter(
        Settings(cloudflare_account_id="acct", cloudflare_api_token="token"),
        primary=FakeProvider(provider="groq", error=ProviderError("Groq rate limit", 429)),
        fallback=FakeProvider(provider="cloudflare-workers-ai"),
    )

    response = await router.generate(messages=[{"role": "user", "content": "hola"}], selection=selection())

    assert response.usage["fallback_reason"] == "rate_limited"


@pytest.mark.asyncio
async def test_auth_error_does_not_fallback() -> None:
    router = AIProviderRouter(
        Settings(cloudflare_account_id="acct", cloudflare_api_token="token"),
        primary=FakeProvider(provider="groq", error=ProviderError("Groq authentication failed", 401)),
        fallback=FakeProvider(provider="cloudflare-workers-ai"),
    )

    with pytest.raises(ProviderError):
        await router.generate(messages=[{"role": "user", "content": "hola"}], selection=selection())


@pytest.mark.asyncio
async def test_validation_error_does_not_fallback() -> None:
    router = AIProviderRouter(
        Settings(cloudflare_account_id="acct", cloudflare_api_token="token"),
        primary=FakeProvider(provider="groq", error=ProviderError("Groq request rejected", 400)),
        fallback=FakeProvider(provider="cloudflare-workers-ai"),
    )

    with pytest.raises(ProviderError):
        await router.generate(messages=[{"role": "user", "content": "hola"}], selection=selection())


@pytest.mark.asyncio
async def test_unconfigured_groq_can_use_cloudflare_fallback() -> None:
    router = AIProviderRouter(
        Settings(cloudflare_account_id="acct", cloudflare_api_token="token"),
        primary=FakeProvider(provider="groq", error=ProviderError("Groq is not configured")),
        fallback=FakeProvider(provider="cloudflare-workers-ai"),
    )

    response = await router.generate(messages=[{"role": "user", "content": "hola"}], selection=selection())

    assert response.provider == "cloudflare-workers-ai"
    assert response.usage["fallback_used"] is True


def test_cloudflare_fallback_uses_legacy_low_model_when_new_variable_missing() -> None:
    settings = Settings(ai_model_low="@cf/zai-org/glm-4.7-flash", cloudflare_ai_model="")

    assert settings.cloudflare_text_model == "@cf/zai-org/glm-4.7-flash"

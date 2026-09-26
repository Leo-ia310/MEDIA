from dataclasses import dataclass, field
from typing import Any, Literal

from app.models.schemas import Citation, Effort


@dataclass(frozen=True)
class ModelSelection:
    effort: Effort
    model_id: str
    max_tokens: int
    temperature: float
    retrieval_top_k: int
    verification_passes: int
    provider: Literal["groq", "cloudflare"] = "groq"
    reasoning_effort: Literal["low", "medium", "high"] = "medium"
    supports_vision: bool = False


@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    latency_ms: int
    usage: dict[str, Any] = field(default_factory=dict)


@dataclass
class EvidenceChunk:
    id: str
    document_id: str
    content: str
    title: str
    section: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    pdf_url: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def citation(self) -> Citation:
        return Citation(
            document_id=self.document_id,
            title=self.title,
            section=self.section,
            page_start=self.page_start,
            page_end=self.page_end,
            pdf_url=self.pdf_url,
        )

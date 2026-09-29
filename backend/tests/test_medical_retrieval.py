import pytest

from app.ai.retrieval import RetrievalService
from app.core.config import Settings
from app.core.exceptions import ProviderError


class FakeRepo:
    async def request(self, **kwargs):
        assert kwargs["table"] == "medical_chunks"
        assert kwargs["method"] == "GET"
        assert kwargs["token"] == "token"
        return [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "document_id": "22222222-2222-2222-2222-222222222222",
                "content": "El cuerpo humano se organiza en cabeza, cuello, tronco y extremidades.",
                "page_start": 4,
                "page_end": 5,
                "section": "Anatomia general",
                "subsection": None,
                "chunk_index": 1,
                "metadata": {},
                "medical_documents": {
                    "id": "22222222-2222-2222-2222-222222222222",
                    "title": "Manual verificado de anatomia",
                    "pdf_url": "https://example.test/anatomia.pdf",
                    "verified": True,
                    "status": "current",
                },
            }
        ]


class FailingRepo:
    async def request(self, **kwargs):
        raise ProviderError("Supabase table request failed for medical_chunks")


@pytest.mark.asyncio
async def test_medical_retrieval_returns_supabase_medical_evidence() -> None:
    chunks = await RetrievalService(Settings(), FakeRepo()).retrieve(
        question="partes del cuerpo humano",
        token="token",
        top_k=3,
    )

    assert chunks
    assert chunks[0].title == "Manual verificado de anatomia"
    assert chunks[0].metadata["source"] == "supabase_medical"
    assert chunks[0].page_start == 4


@pytest.mark.asyncio
async def test_medical_retrieval_falls_back_to_local_reference_markdown() -> None:
    chunks = await RetrievalService(Settings(), FailingRepo()).retrieve(
        question="hipertension arterial tratamiento presion",
        token="token",
        top_k=3,
    )

    assert chunks
    assert chunks[0].metadata["source"] == "local_reference_markdown"
    assert chunks[0].pdf_url


@pytest.mark.asyncio
async def test_local_reference_markdown_filters_weak_matches() -> None:
    chunks = await RetrievalService(Settings(), FailingRepo()).retrieve(
        question="hola que son las arterias",
        token="token",
        top_k=4,
    )

    assert chunks
    assert all(chunk.metadata["score"] >= 2.0 for chunk in chunks)
    assert any("Anatomy" in chunk.title for chunk in chunks)

import pytest

from app.ai.retrieval import RetrievalService
from app.core.config import Settings


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

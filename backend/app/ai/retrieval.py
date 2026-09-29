from __future__ import annotations

from uuid import uuid5, NAMESPACE_URL

from app.ai.schemas import EvidenceChunk
from app.ai.text_index import expand_medical_tokens, score_tokens, tokens
from app.core.config import Settings
from app.core.exceptions import ProviderError
from app.db.supabase import SupabaseRepository
from app.services.reference_ingestion import ReferenceDocument, ReferenceIngestionService


QUERY_STOPWORDS = {
    "que",
    "como",
    "cual",
    "cuales",
    "cuáles",
    "son",
    "las",
    "los",
    "una",
    "uno",
    "unos",
    "del",
    "con",
    "para",
    "hola",
    "dime",
    "explica",
    "what",
    "which",
    "the",
    "and",
    "about",
}

LOCAL_REFERENCE_MIN_SCORE = 2.0


class RetrievalService:
    """Retrieves vetted medical evidence from Supabase.

    Obsidian project notes are intentionally excluded from this service. Only
    Supabase medical chunks can become citations or move an answer to grounded.
    """

    def __init__(self, settings: Settings, repo: SupabaseRepository) -> None:
        self.settings = settings
        self.repo = repo
        self._local_documents: list[ReferenceDocument] | None = None

    async def retrieve(self, *, question: str, token: str, top_k: int) -> list[EvidenceChunk]:
        query_tokens = expand_medical_tokens(tokens(question) - QUERY_STOPWORDS)
        if not query_tokens:
            return []

        try:
            rows = await self._fetch_candidate_chunks(token=token, query_tokens=query_tokens)
        except ProviderError:
            return self._retrieve_local_references(query_tokens=query_tokens, top_k=top_k)
        if not rows:
            local_evidence = self._retrieve_local_references(query_tokens=query_tokens, top_k=top_k)
            if local_evidence:
                return local_evidence

        scored = []
        for row in rows:
            content = row.get("content") or ""
            document = _document(row)
            title = document.get("title") or "Documento medico"
            section = row.get("section") or row.get("subsection")
            chunk_tokens = tokens(f"{title} {section or ''} {content}")
            score = score_tokens(query_tokens, chunk_tokens, title, section)
            if score > 0:
                scored.append((score, row, document))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            EvidenceChunk(
                id=row["id"],
                document_id=row["document_id"],
                content=row["content"],
                title=document.get("title") or "Documento medico",
                section=row.get("section") or row.get("subsection"),
                page_start=row.get("page_start"),
                page_end=row.get("page_end"),
                pdf_url=document.get("pdf_url"),
                metadata={
                    "source": "supabase_medical",
                    "score": round(score, 4),
                    "chunk_index": row.get("chunk_index"),
                },
            )
            for score, row, document in scored[:top_k]
        ]

    def _retrieve_local_references(self, *, query_tokens: set[str], top_k: int) -> list[EvidenceChunk]:
        scored = []
        for document in self._load_local_documents():
            document_id = str(uuid5(NAMESPACE_URL, document.markdown_path.resolve().as_posix()))
            pdf_url = self._local_pdf_url(document)
            for chunk in document.chunks:
                chunk_tokens = tokens(f"{document.title} {chunk.section or ''} {chunk.subsection or ''} {chunk.content}")
                score = score_tokens(query_tokens, chunk_tokens, document.title, chunk.section or chunk.subsection)
                if score < LOCAL_REFERENCE_MIN_SCORE:
                    continue
                scored.append((score, document, document_id, pdf_url, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            EvidenceChunk(
                id=str(uuid5(NAMESPACE_URL, f"{document.markdown_path.resolve().as_posix()}#{chunk.chunk_index}")),
                document_id=document_id,
                content=chunk.content,
                title=document.title,
                section=chunk.section or chunk.subsection,
                page_start=chunk.page_start,
                page_end=chunk.page_end,
                pdf_url=pdf_url,
                metadata={
                    "source": "local_reference_markdown",
                    "score": round(score, 4),
                    "chunk_index": chunk.chunk_index,
                    "source_markdown": document.markdown_path.name,
                },
            )
            for score, document, document_id, pdf_url, chunk in scored[:top_k]
        ]

    def _load_local_documents(self) -> list[ReferenceDocument]:
        if self._local_documents is None:
            self._local_documents = ReferenceIngestionService(self.settings).discover()
        return self._local_documents

    def _local_pdf_url(self, document: ReferenceDocument) -> str | None:
        if document.pdf_path is None:
            return None
        return ReferenceIngestionService(self.settings).pdf_url(document.pdf_path)

    async def _fetch_candidate_chunks(self, *, token: str, query_tokens: set[str]) -> list[dict]:
        base_params = {
            "select": "id,document_id,content,page_start,page_end,section,subsection,chunk_index,metadata,medical_documents!inner(id,title,pdf_url,verified,status)",
            "medical_documents.verified": "eq.true",
            "medical_documents.status": "neq.archived",
            "order": "chunk_index.asc",
            "limit": str(self.settings.medical_retrieval_candidate_limit),
        }
        terms = _search_terms(query_tokens)
        if terms:
            filtered_params = dict(base_params)
            filtered_params["or"] = "(" + ",".join(
                filter_expr
                for term in terms
                for filter_expr in (
                    f"content.ilike.*{term}*",
                    f"section.ilike.*{term}*",
                    f"subsection.ilike.*{term}*",
                )
            ) + ")"
            rows = await self.repo.request(
                table="medical_chunks",
                method="GET",
                token=token,
                params=filtered_params,
            )
            if rows:
                return rows

        rows = await self.repo.request(
            table="medical_chunks",
            method="GET",
            token=token,
            params=base_params,
        )
        return rows or []


def _document(row: dict) -> dict:
    value = row.get("medical_documents") or {}
    if isinstance(value, list):
        return value[0] if value else {}
    return value


SERVER_FILTER_STOPWORDS = {
    "que",
    "como",
    "para",
    "con",
    "una",
    "unos",
    "las",
    "los",
    "del",
    "sobre",
    "explica",
    "dime",
    "cuales",
    "cuáles",
    "what",
    "which",
    "about",
    "explain",
}


def _search_terms(query_tokens: set[str]) -> list[str]:
    safe_terms = []
    for token in sorted(query_tokens, key=lambda item: (-len(item), item)):
        if len(token) < 4 or token in SERVER_FILTER_STOPWORDS:
            continue
        if not token.replace("-", "").replace("_", "").isalnum():
            continue
        safe_terms.append(token)
    return safe_terms[:8]

from __future__ import annotations

from app.ai.schemas import EvidenceChunk
from app.ai.text_index import expand_medical_tokens, score_tokens, tokens
from app.core.config import Settings
from app.db.supabase import SupabaseRepository


class RetrievalService:
    """Retrieves vetted medical evidence from Supabase.

    Obsidian project notes are intentionally excluded from this service. Only
    Supabase medical chunks can become citations or move an answer to grounded.
    """

    def __init__(self, settings: Settings, repo: SupabaseRepository) -> None:
        self.settings = settings
        self.repo = repo

    async def retrieve(self, *, question: str, token: str, top_k: int) -> list[EvidenceChunk]:
        query_tokens = expand_medical_tokens(tokens(question))
        if not query_tokens:
            return []

        rows = await self._fetch_candidate_chunks(token=token, query_tokens=query_tokens)
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

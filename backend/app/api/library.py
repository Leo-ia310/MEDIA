from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.services.reference_ingestion import ReferenceIngestionService, relative_to_repo

router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("")
async def library_catalog(settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    return _catalog(settings.references_dir, settings.reference_markdown_dir, settings.backend_public_base_url, settings.reference_chunk_chars)


def _catalog(references_dir: str, markdown_dir: str, backend_public_base_url: str, chunk_chars: int) -> dict[str, Any]:
    settings = Settings(
        references_dir=references_dir,
        reference_markdown_dir=markdown_dir,
        backend_public_base_url=backend_public_base_url,
        reference_chunk_chars=chunk_chars,
    )
    service = ReferenceIngestionService(settings)
    documents = []
    for item in service.catalog():
        category, branch = classify_reference(item.title, item.metadata, item.markdown_path)
        source_pdf = relative_to_repo(item.pdf_path) if item.pdf_path else None
        documents.append(
            {
                "id": item.markdown_path.stem,
                "title": item.title,
                "category": category,
                "branch": branch,
                "language": item.metadata.get("language"),
                "year": item.metadata.get("year") or item.metadata.get("publication_year"),
                "authors": _list(item.metadata.get("authors") or item.metadata.get("author")),
                "topics": _list(item.metadata.get("topics") or item.metadata.get("domain") or item.metadata.get("specialty")),
                "document_type": item.metadata.get("document_type"),
                "license": item.metadata.get("license"),
                "pdf_pages": item.metadata.get("pdf_pages"),
                "pdf_url": service.pdf_url(item.pdf_path) if item.pdf_path else None,
                "source_pdf": source_pdf,
                "source_markdown": relative_to_repo(item.markdown_path),
            }
        )
    documents.sort(key=lambda doc: (doc["category"], doc["branch"], doc["title"].lower()))
    return {
        "documents": documents,
        "total": len(documents),
        "categories": _category_summary(documents),
    }


def classify_reference(title: str, metadata: dict[str, Any], path: Path) -> tuple[str, str]:
    text = " ".join(
        [
            title,
            path.stem,
            " ".join(_list(metadata.get("topics"))),
            " ".join(_list(metadata.get("domain"))),
            str(metadata.get("document_type") or ""),
            str(metadata.get("specialty") or ""),
        ]
    ).lower()
    rules = [
        ("Anatomia y fisiologia", "Anatomia humana", ("anatom", "orienta clinica")),
        ("Anatomia y fisiologia", "Fisiologia", ("fisiol", "guyton", "exercise physiology", "pathophysiological")),
        ("Anatomia y fisiologia", "Neurociencias", ("brain", "cerebro", "headache", "neurolog", "encefalop")),
        ("Biologia basica", "Biologia celular", ("cell biology", "biologia celular", "celular", "histologia", "histolog")),
        ("Biologia basica", "Bioquimica y genetica", ("biochemistry", "genetics", "genomics", "bioquim", "metabolic", "metabolicas")),
        ("Microbiologia e infecciones", "Microbiologia", ("microbiolog", "microbiology")),
        ("Microbiologia e infecciones", "Parasitologia", ("parasite", "parasit", "helminth", "schistosom", "strongyloid")),
        ("Microbiologia e infecciones", "Guias infecciosas", ("influenza", "chikungunya", "fever", "tick", "garrapata", "mosquito")),
        ("Farmacologia", "Farmacologia general", ("farmacolog", "pharmacology", "adverse", "hipersensibilidad")),
        ("Farmacologia", "Antimicrobianos", ("antibiotic", "aware", "pharmacovigilance")),
        ("Salud publica e investigacion", "Epidemiologia", ("epidemiolog", "indicadores", "screening", "cancer screening")),
        ("Salud publica e investigacion", "Bioestadistica", ("bioestad", "statistics", "daniel wayne")),
        ("Clinica", "Guias clinicas", ("guideline", "clinical practice", "management", "luts", "sexual", "reproductive")),
        ("Clinica", "Casos y revisiones", ("case report", "foreign body", "acute limb", "colorectal", "xenotransplant")),
        ("Nutricion y deporte", "Nutricion", ("nutrition", "nutricion", "dietary", "recovery", "collagen")),
        ("Nutricion y deporte", "Entrenamiento", ("resistance training", "hypertrophy", "strength", "creatine", "athletic")),
        ("Ciencias base", "Quimica y biofisica", ("quimica", "chemistry", "biofisica", "matematic")),
        ("Historia y humanidades", "Historia de la medicina", ("historia", "history")),
        ("Pediatria y atencion primaria", "Pediatria", ("children", "adolescents", "primary health care")),
    ]
    for category, branch, needles in rules:
        if any(needle in text for needle in needles):
            return category, branch
    return "General", "Referencia medica"


def _list(value: Any) -> list[str]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item is not None and str(item).strip()]
    return [str(value)]


def _category_summary(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, int]] = {}
    for doc in documents:
        grouped.setdefault(doc["category"], {})
        grouped[doc["category"]][doc["branch"]] = grouped[doc["category"]].get(doc["branch"], 0) + 1
    return [
        {
            "name": category,
            "count": sum(branches.values()),
            "branches": [{"name": name, "count": count} for name, count in sorted(branches.items())],
        }
        for category, branches in sorted(grouped.items())
    ]

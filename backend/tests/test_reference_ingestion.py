from pathlib import Path

from app.core.config import Settings
from app.services.reference_ingestion import ReferenceIngestionService, chunk_markdown, parse_frontmatter


def test_parse_frontmatter_reads_lists_and_scalars() -> None:
    text = """---
title: "Doc Title"
organization:
  - "Org A"
  - "Org B"
source_file: "source.pdf"
clinical_guidance: false
physical_pdf_pages: 12
---
# Body
"""

    metadata = parse_frontmatter(text)

    assert metadata["title"] == "Doc Title"
    assert metadata["organization"] == ["Org A", "Org B"]
    assert metadata["source_file"] == "source.pdf"
    assert metadata["clinical_guidance"] is False
    assert metadata["physical_pdf_pages"] == 12


def test_chunk_markdown_preserves_pdf_pages_and_sections(tmp_path: Path) -> None:
    markdown_path = tmp_path / "doc.md"
    body = """# Main
<!-- PDF_PAGE: 4 -->
This section explains the human body, head, neck, trunk, and extremities with enough detail to become a chunk.

<!-- PDF_PAGE: 5 -->
More anatomy content continues here for retrieval and citations.

## Second
Another section with clinical reference content that is long enough to keep.
"""

    chunks = chunk_markdown(body, chunk_chars=240, markdown_path=markdown_path)

    assert chunks[0].section == "Main"
    assert chunks[0].page_start == 4
    assert chunks[0].page_end == 5
    assert "PDF_PAGE" not in chunks[0].content
    assert chunks[-1].section == "Second"


def test_reference_document_payload_links_pdf(tmp_path: Path) -> None:
    references = tmp_path / "Referencias"
    md_dir = references / "MDs"
    md_dir.mkdir(parents=True)
    pdf = references / "source doc.pdf"
    pdf.write_bytes(b"%PDF")
    (md_dir / "doc.md").write_text(
        """---
title: "Source Doc"
organization: "WHO"
publication_date: "2025"
specialties:
  - public_health
source_file: "source doc.pdf"
---
# Source Doc
Enough reference content about health, anatomy, and clinical care to build a useful searchable chunk.
""",
        encoding="utf-8",
    )
    settings = Settings(
        references_dir=str(references),
        reference_markdown_dir=str(md_dir),
        backend_public_base_url="http://127.0.0.1:8000",
    )

    service = ReferenceIngestionService(settings)
    document = service.discover()[0]
    payload = service.document_payload(document)

    assert document.pdf_path == pdf.resolve()
    assert payload["pdf_url"] == "http://127.0.0.1:8000/references/source%20doc.pdf"
    assert payload["pdf_path"].endswith("source doc.pdf")
    assert payload["verified"] is True
    assert payload["status"] == "current"

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path


TOKEN_RE = re.compile(r"[a-z0-9áéíóúñü]{3,}", re.IGNORECASE)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)


@dataclass(frozen=True)
class MarkdownChunk:
    path: Path
    title: str
    section: str | None
    content: str
    tokens: frozenset[str]


def normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def tokens(text: str) -> set[str]:
    return set(TOKEN_RE.findall(normalize(text)))


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2]
    return text


def title_from_note(path: Path, text: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", text, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return path.stem.replace("-", " ").title()


def sections(text: str) -> list[tuple[str | None, str]]:
    matches = list(HEADING_RE.finditer(text))
    if not matches:
        return [(None, text)]

    result: list[tuple[str | None, str]] = []
    intro = text[: matches[0].start()].strip()
    if intro:
        result.append((None, intro))
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        heading = match.group(2).strip()
        content = text[start:end].strip()
        if content:
            result.append((heading, content))
    return result


def split_text(text: str, chunk_chars: int) -> list[str]:
    if len(text) <= chunk_chars:
        return [text]
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", text) if paragraph.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) + 2 > chunk_chars:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}".strip()
    if current:
        chunks.append(current)
    return chunks


def score_tokens(query_tokens: set[str], chunk_tokens: set[str], title: str, section: str | None) -> float:
    overlap = query_tokens & chunk_tokens
    if not overlap:
        return 0
    title_tokens = tokens(title)
    section_tokens = tokens(section or "")
    score = float(len(overlap))
    score += len(overlap & title_tokens) * 1.8
    score += len(overlap & section_tokens) * 1.2
    score += len(overlap) / max(len(query_tokens), 1)
    return score


MEDICAL_QUERY_EXPANSIONS: dict[str, set[str]] = {
    "cuerpo": {"body", "human", "anatomy", "anatomical"},
    "partes": {"parts", "regions", "structures"},
    "cabeza": {"head", "cephalic"},
    "cuello": {"neck", "cervical"},
    "tronco": {"trunk", "torso", "thorax", "abdomen", "pelvis"},
    "extremidades": {"limbs", "extremities", "arms", "legs", "upper", "lower"},
    "brazo": {"arm", "upper limb"},
    "pierna": {"leg", "lower limb"},
    "hueso": {"bone", "skeletal"},
    "musculo": {"muscle", "muscular"},
    "corazon": {"heart", "cardiac", "cardiovascular"},
    "cardiaca": {"heart", "cardiac"},
    "cardiaco": {"heart", "cardiac"},
    "insuficiencia": {"failure", "insufficiency"},
    "renal": {"renal", "kidney"},
    "rinon": {"kidney", "renal"},
    "rinones": {"kidneys", "renal"},
    "presion": {"pressure"},
    "arterial": {"arterial", "blood"},
    "hipertension": {"hypertension", "blood", "pressure"},
    "diabetes": {"diabetes", "glycemic", "glucose"},
    "lipidos": {"lipids", "cholesterol", "statin"},
    "colesterol": {"cholesterol", "lipid", "ldl"},
    "renina": {"renin"},
    "angiotensina": {"angiotensin"},
    "aldosterona": {"aldosterone"},
    "raas": {"renin", "angiotensin", "aldosterone"},
    "neumonia": {"pneumonia"},
    "diarrea": {"diarrhoea", "diarrhea"},
    "vih": {"hiv"},
    "malaria": {"malaria"},
    "embarazo": {"pregnancy", "maternal"},
    "materna": {"maternal"},
    "antibiotico": {"antibiotic", "antimicrobial"},
    "antibioticos": {"antibiotics", "antimicrobials"},
    "ictus": {"stroke"},
    "derrame": {"stroke"},
    "rehabilitacion": {"rehabilitation"},
    "salud": {"health"},
    "mental": {"mental"},
}


def expand_medical_tokens(query_tokens: set[str]) -> set[str]:
    expanded = set(query_tokens)
    for token in list(query_tokens):
        expanded.update(MEDICAL_QUERY_EXPANSIONS.get(token, set()))
    return {token for token in expanded if len(token) >= 3}

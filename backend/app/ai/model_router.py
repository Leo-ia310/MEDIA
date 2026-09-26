from app.ai.text_index import normalize, tokens
from app.core.config import Settings
from app.models.schemas import Effort

from .schemas import ModelSelection


COMPLEXITY_TERMS = {
    "analiza",
    "analisis",
    "compara",
    "comparar",
    "diferencia",
    "relacion",
    "relaciona",
    "explica",
    "fisiologia",
    "fisiopatologia",
    "mecanismo",
    "mecanismos",
    "diagnostico",
    "tratamiento",
    "farmacos",
    "medicamentos",
    "contraindicaciones",
    "complicaciones",
    "riesgos",
    "monitoreo",
    "vigilancia",
    "algoritmo",
    "manejo",
    "protocolo",
    "evidencia",
    "guias",
    "citas",
    "fuentes",
    "caso",
    "clinico",
    "laboratorios",
    "interpretacion",
    "diferencial",
    "pronostico",
}

MEDICAL_COMPLEXITY_TERMS = {
    "raas",
    "renina",
    "angiotensina",
    "aldosterona",
    "hipertension",
    "cardiaca",
    "cardiaco",
    "renal",
    "erc",
    "ckd",
    "diabetes",
    "hiperpotasemia",
    "creatinina",
    "glomerular",
    "nefrona",
    "proteinuria",
    "albuminuria",
    "eclampsia",
    "sepsis",
    "shock",
    "malaria",
    "vih",
    "antibioticos",
    "resistencia",
    "ictus",
    "stroke",
}

HIGH_COMPLEXITY_PHRASES = (
    "paso a paso",
    "en detalle",
    "nivel avanzado",
    "profundidad",
    "con ejemplos",
    "con fuentes",
    "con citas",
    "segun la guia",
    "según la guia",
    "segun las guias",
    "según las guias",
    "diagnostico diferencial",
    "caso clinico",
    "caso clínico",
)


class ModelRouter:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def select(self, effort: Effort) -> ModelSelection:
        if effort == Effort.low:
            return ModelSelection(effort, self.settings.groq_low_model, max_tokens=1200, temperature=0.2, retrieval_top_k=4, verification_passes=1, provider="groq", reasoning_effort="low")
        if effort == Effort.high:
            return ModelSelection(effort, self.settings.groq_high_model, max_tokens=3200, temperature=0.15, retrieval_top_k=10, verification_passes=2, provider="groq", reasoning_effort="high")
        return ModelSelection(effort, self.settings.groq_medium_model, max_tokens=2200, temperature=0.2, retrieval_top_k=7, verification_passes=1, provider="groq", reasoning_effort="medium")

    def select_for_prompt(self, requested_effort: Effort, prompt: str) -> ModelSelection:
        effective_effort = self.effective_effort(requested_effort, prompt)
        return self.select(effective_effort)

    def effective_effort(self, requested_effort: Effort, prompt: str) -> Effort:
        automatic_effort = self.classify_prompt_effort(prompt)
        if requested_effort == Effort.high:
            return Effort.high
        if requested_effort == Effort.medium and automatic_effort == Effort.low:
            return Effort.medium
        return max_effort(requested_effort, automatic_effort)


    def select_for_request(self, requested_effort: Effort, prompt: str, *, has_image: bool = False) -> ModelSelection:
        selection = self.select_for_prompt(requested_effort, prompt)
        if has_image:
            return ModelSelection(
                effort=selection.effort,
                model_id=self.settings.groq_vision_model,
                max_tokens=selection.max_tokens,
                temperature=selection.temperature,
                retrieval_top_k=selection.retrieval_top_k,
                verification_passes=selection.verification_passes,
                provider="groq",
                reasoning_effort=selection.reasoning_effort,
                supports_vision=True,
            )
        return selection

    def classify_prompt_effort(self, prompt: str) -> Effort:
        normalized = normalize(prompt)
        prompt_tokens = tokens(prompt)
        words = normalized.split()
        word_count = len(words)
        score = 0

        if word_count >= 55:
            score += 4
        elif word_count >= 30:
            score += 3
        elif word_count >= 16:
            score += 1

        score += min(len(prompt_tokens & COMPLEXITY_TERMS), 4)
        score += min(len(prompt_tokens & MEDICAL_COMPLEXITY_TERMS), 5)
        score += sum(2 for phrase in HIGH_COMPLEXITY_PHRASES if phrase in normalized)

        separators = prompt.count(",") + prompt.count(";") + prompt.count(":")
        if separators >= 3:
            score += 1
        if "?" in prompt and word_count >= 18:
            score += 1
        if any(connector in normalized for connector in (" y ", " con ", " entre ", " vs ", " versus ")) and len(prompt_tokens & MEDICAL_COMPLEXITY_TERMS) >= 2:
            score += 2

        if score >= 8:
            return Effort.high
        if score >= 3:
            return Effort.medium
        return Effort.low


def max_effort(left: Effort, right: Effort) -> Effort:
    order = {Effort.low: 0, Effort.medium: 1, Effort.high: 2}
    return left if order[left] >= order[right] else right

from app.ai.schemas import EvidenceChunk
from app.core.config import Settings


class RetrievalService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def retrieve(self, *, question: str, user_id: str, top_k: int) -> list[EvidenceChunk]:
        # No hay documentos medicos cargados todavia. Esta clase deja listo el contrato
        # para la siguiente fase: embeddings de la pregunta + similarity search en pgvector.
        return []

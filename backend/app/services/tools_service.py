from app.models.schemas import ClinicalAnswerRequest, ClinicalCaseRequest, FlashcardRequest, MindmapRequest, QuizRequest, ToolPreparedResponse


class ToolsService:
    async def quiz(self, request: QuizRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Quiz generation contract is ready; generation will be enabled after vetted sources are available.", contract=request.model_dump())

    async def flashcards(self, request: FlashcardRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Flashcard generation contract is ready; generation will be enabled after vetted sources are available.", contract=request.model_dump())

    async def mindmap(self, request: MindmapRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Mind map JSON contract is ready for the frontend renderer.", contract={"type": request.type, "topic": request.topic, "nodes": [], "edges": []})

    async def clinical_case(self, request: ClinicalCaseRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical case contract is ready; educational generation will be enabled with evidence-backed content.", contract=request.model_dump())

    async def clinical_answer(self, case_id: str, request: ClinicalAnswerRequest) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical answer evaluation contract is ready.", contract={"case_id": case_id, "answer_length": len(request.answer)})

    async def clinical_hint(self, case_id: str) -> ToolPreparedResponse:
        return ToolPreparedResponse(status="prepared", message="Clinical hint contract is ready.", contract={"case_id": case_id})

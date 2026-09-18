from datetime import datetime
from enum import Enum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Effort(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"
    tool = "tool"


class AnswerStatus(str, Enum):
    grounded = "grounded"
    unverified_model_knowledge = "unverified_model_knowledge"
    insufficient_evidence = "insufficient_evidence"
    provider_error = "provider_error"


class VerificationStatus(str, Enum):
    verified = "verified"
    unverified_model_knowledge = "unverified_model_knowledge"
    insufficient_evidence = "insufficient_evidence"
    failed = "failed"


class AuthUser(BaseModel):
    id: UUID
    email: str | None = None
    token: str


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=8000)
    effort: Effort = Effort.medium


class Citation(BaseModel):
    document_id: UUID
    title: str
    section: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    pdf_url: str | None = None


class RelatedAsset(BaseModel):
    id: UUID
    type: str
    caption: str | None = None
    path: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    answer: str
    answer_status: AnswerStatus
    verification_status: VerificationStatus
    effort: Effort
    model: str | None = None
    citations: list[Citation] = Field(default_factory=list)
    related_assets: list[RelatedAsset] = Field(default_factory=list)
    suggested_followup: str | None = None
    can_request_knowledge: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=160)


class ConversationOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    archived: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    user_id: UUID
    role: MessageRole
    content: str
    model: str | None = None
    effort: Effort | None = None
    answer_status: AnswerStatus | None = None
    verification_status: VerificationStatus | None = None
    created_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = Field(default_factory=list)


class LearningProfileOut(BaseModel):
    user_id: UUID
    preferred_explanation_style: str = "balanced"
    preferred_difficulty: str = "intermediate"
    strengths: list[str] = Field(default_factory=list)
    growth_areas: list[str] = Field(default_factory=list)
    recurring_confusions: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeRequestIn(BaseModel):
    conversation_id: UUID | None = None
    original_question: str = Field(min_length=1, max_length=8000)
    normalized_topic: str | None = Field(default=None, max_length=160)
    normalized_subtopic: str | None = Field(default=None, max_length=160)


class KnowledgeRequestOut(BaseModel):
    id: UUID
    user_id: UUID
    conversation_id: UUID | None = None
    original_question: str
    normalized_topic: str | None = None
    normalized_subtopic: str | None = None
    status: str = "pending"
    request_count: int = 1


class QuizRequest(BaseModel):
    conversation_id: UUID | None = None
    topic: str = Field(min_length=1, max_length=200)
    difficulty: Literal["basic", "intermediate", "advanced"] = "intermediate"
    question_count: int = Field(default=5, ge=1, le=20)


class FlashcardRequest(BaseModel):
    conversation_id: UUID | None = None
    topic: str = Field(min_length=1, max_length=200)
    card_count: int = Field(default=10, ge=1, le=40)
    difficulty: Literal["basic", "intermediate", "advanced"] = "intermediate"
    answer_length: Literal["short", "medium"] = "short"
    clinical_context: bool = False


class MindmapRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    type: Literal["mind_map", "concept_map", "synoptic_chart", "relationship_diagram"] = "mind_map"


class ToolPreparedResponse(BaseModel):
    status: Literal["prepared"]
    message: str
    contract: dict[str, Any]


class ClinicalCaseRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    difficulty: Literal["basic", "intermediate", "advanced"] = "intermediate"
    mode: Literal["guided", "progressive_hints", "direct_evaluation", "adaptive"] = "guided"


class ClinicalAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=8000)


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unavailable"]
    backend: Literal["healthy"]
    database: Literal["healthy", "degraded", "unavailable"]
    ai_provider_configuration: Literal["healthy", "degraded", "unavailable"]
    details: dict[str, Any] = Field(default_factory=dict)


class AuthCredentials(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=6, max_length=128)


class AuthSessionOut(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None
    message: str | None = None
    user: dict[str, Any] = Field(default_factory=dict)


class VerificationResult(BaseModel):
    evidence_sufficient: bool
    claims_supported: bool
    citations_valid: bool
    contradictions_detected: bool
    needs_regeneration: bool
    verification_status: VerificationStatus
    answer_status: AnswerStatus

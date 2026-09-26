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


class ChatAttachment(BaseModel):
    type: Literal["image", "file"] = "file"
    name: str | None = Field(default=None, max_length=240)
    mime_type: str | None = Field(default=None, max_length=120)
    url: str | None = Field(default=None, max_length=2_000_000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=8000)
    effort: Effort = Effort.medium
    attachments: list[ChatAttachment] = Field(default_factory=list, max_length=6)


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
    question_type: Literal["multiple_choice", "short_answer", "mixed"] = "multiple_choice"


class FlashcardRequest(BaseModel):
    conversation_id: UUID | None = None
    topic: str = Field(min_length=1, max_length=200)
    card_count: int = Field(default=10, ge=1, le=40)
    difficulty: Literal["basic", "intermediate", "advanced"] = "intermediate"
    answer_length: Literal["short", "medium"] = "short"
    clinical_context: bool = False
    mode: Literal["concepts", "clinical", "exam"] = "concepts"


class MindmapRequest(BaseModel):
    conversation_id: UUID | None = None
    topic: str = Field(min_length=1, max_length=200)
    type: Literal["mind_map", "concept_map", "synoptic_chart", "relationship_diagram"] = "mind_map"
    detail_level: Literal["basic", "intermediate", "advanced"] = "intermediate"


class PresentationRequest(BaseModel):
    conversation_id: UUID
    topic: str | None = Field(default=None, max_length=200)
    slide_count: int = Field(default=8, ge=3, le=20)
    include_images: bool = True
    presentation_type: Literal["class", "oral_expo", "study_summary", "clinical_case"] = "study_summary"
    audience: str | None = Field(default=None, max_length=120)


class ReportRequest(BaseModel):
    conversation_id: UUID
    topic: str | None = Field(default=None, max_length=200)
    report_type: Literal["study_summary", "progress_report", "clinical_brief"] = "study_summary"
    include_recommendations: bool = True
    focus: str | None = Field(default=None, max_length=200)


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=3000)
    quality: Literal["fast", "quality"] = "fast"
    aspect_ratio: Literal["1:1", "4:3", "3:4", "16:9", "9:16"] = "1:1"


class GeneratedImageOut(BaseModel):
    mime_type: str
    data: str
    model: str
    provider: str = "gemini"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ImageGenerationResponse(BaseModel):
    status: Literal["generated"]
    image: GeneratedImageOut


class MindmapNode(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=600)
    level: int | None = Field(default=None, ge=0, le=12)
    category: str | None = Field(default=None, max_length=80)


class MindmapEdge(BaseModel):
    source: str = Field(min_length=1, max_length=80)
    target: str = Field(min_length=1, max_length=80)
    label: str | None = Field(default=None, max_length=160)


class StructuredMindmap(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=800)
    nodes: list[MindmapNode] = Field(min_length=1, max_length=80)
    edges: list[MindmapEdge] = Field(default_factory=list, max_length=160)


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


class RefreshTokenIn(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=4096)


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

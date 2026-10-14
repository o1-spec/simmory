from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SpeechStatus(str, Enum):
    USABLE_SPEECH = "USABLE_SPEECH"
    NO_AUDIO_TRACK = "NO_AUDIO_TRACK"
    NO_USABLE_SPEECH = "NO_USABLE_SPEECH"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"


class ProcessingStage(str, Enum):
    PREPARING_MEDIA = "PREPARING_MEDIA"
    EXTRACTING_AUDIO = "EXTRACTING_AUDIO"
    CHECKING_SPEECH = "CHECKING_SPEECH"
    TRANSCRIBING = "TRANSCRIBING"
    EXTRACTING_FRAMES = "EXTRACTING_FRAMES"
    ANALYZING_FRAMES = "ANALYZING_FRAMES"
    GENERATING_TIMELINE = "GENERATING_TIMELINE"
    VALIDATING_OUTPUT = "VALIDATING_OUTPUT"
    SAVING_RESULTS = "SAVING_RESULTS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TranscriptSegmentModel(BaseModel):
    start: float = Field(..., ge=0.0, description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    text: str = Field(..., min_length=1, description="Transcribed spoken instruction or dialogue")
    language: Optional[str] = None
    needs_review: bool = False
    position: int = 0

    @field_validator("end")
    @classmethod
    def end_must_exceed_start(cls, v: float, info) -> float:
        start = info.data.get("start")
        if start is not None and v <= start:
            raise ValueError(f"End time ({v}) must be strictly greater than start time ({start})")
        return v


class AudioAnalysisResult(BaseModel):
    status: SpeechStatus
    language: Optional[str] = None
    segments: List[TranscriptSegmentModel] = []
    notes: Optional[str] = None


class FrameObservation(BaseModel):
    frame_id: str = Field(..., description="Internal frame identifier, e.g. frame_001.jpg")
    timestamp_seconds: float = Field(..., ge=0.0, description="Exact timestamp in video")
    visible_action: Optional[str] = Field(None, description="Directly visible tool or hand movement")
    food_appearance: Optional[str] = Field(None, description="Directly visible appearance or texture")
    visible_objects: List[str] = Field(default_factory=list, description="Directly observed utensils, pots, or ingredients")
    uncertain_details: List[str] = Field(default_factory=list, description="Unconfirmed, unclear, or hidden elements")


class VisualAnalysisResult(BaseModel):
    total_frames_extracted: int
    total_frames_analyzed: int
    sampling_interval_seconds: float
    observations: List[FrameObservation] = []


class ProposedEventModel(BaseModel):
    position: int = Field(..., ge=0)
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    evidence_frames: List[str] = Field(..., min_length=1, description="Referenced frame IDs")
    evidence_transcripts: List[str] = Field(default_factory=list, description="Referenced transcript segment indices")
    observed_timestamps: List[float] = Field(default_factory=list, description="Ground-truth timestamps from evidence")
    uncertainties: List[str] = Field(default_factory=list, description="Explicit unconfirmed cooking details")
    question_for_cook: Optional[str] = Field(None, description="Clarification question for family cook")
    verified: bool = Field(default=False, description="Always false for AI reconstructions until human review")

    @field_validator("verified")
    @classmethod
    def cannot_be_pre_verified(cls, v: bool) -> bool:
        if v is True:
            raise ValueError("AI-generated proposed events must never be pre-verified")
        return False


class TimelineReconstructionResult(BaseModel):
    events: List[ProposedEventModel] = []
    status: str = "needs_human_review"
    source_type: str = "visual_only"  # "audio_visual" or "visual_only"


class AIAnalysisResponse(BaseModel):
    schema_version: str = "1.0.0"
    whisper_model: str
    vision_model: str
    video_duration: float
    speech_status: SpeechStatus
    detected_language: Optional[str] = None
    audio: AudioAnalysisResult
    vision: VisualAnalysisResult
    timeline: TimelineReconstructionResult
    summary: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    whisper_available: bool
    ollama_available: bool
    ollama_model_present: bool
    version: str = "1.0.0"

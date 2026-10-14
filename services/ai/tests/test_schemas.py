import pytest
from pydantic import ValidationError
from services.ai.app.schemas import (
    AudioAnalysisResult,
    FrameObservation,
    ProposedEventModel,
    SpeechStatus,
    TranscriptSegmentModel,
)


def test_transcript_segment_validation():
    # Valid segment
    seg = TranscriptSegmentModel(
        start=10.0,
        end=14.5,
        text="Add a cup of water.",
        position=0
    )
    assert seg.start == 10.0
    assert seg.end == 14.5

    # Invalid start/end (end <= start)
    with pytest.raises(ValidationError):
        TranscriptSegmentModel(
            start=15.0,
            end=12.0,
            text="Invalid backwards timing",
            position=1
        )

    with pytest.raises(ValidationError):
        TranscriptSegmentModel(
            start=15.0,
            end=15.0,
            text="Zero duration timing",
            position=2
        )


def test_proposed_event_never_pre_verified():
    # Valid event with verified=False
    event = ProposedEventModel(
        position=0,
        title="Mixing water and flour",
        description="A hand stirs a light mixture inside a pot.",
        evidence_frames=["frame_001.jpg"],
        observed_timestamps=[10.0],
        uncertainties=["Specific flour type is unknown"],
        question_for_cook="What flour is being used?",
        verified=False
    )
    assert event.verified is False

    # Attempting to pre-verify must be rejected by validator
    with pytest.raises(ValidationError):
        ProposedEventModel(
            position=1,
            title="Pre-verified event",
            description="Testing verified rejection",
            evidence_frames=["frame_001.jpg"],
            observed_timestamps=[10.0],
            uncertainties=[],
            verified=True
        )


def test_frame_observation_schema():
    obs = FrameObservation(
        frame_id="frame_003.jpg",
        timestamp_seconds=20.0,
        visible_action="A utensil is placed on the edge of the pot",
        food_appearance="Smooth opaque liquid",
        visible_objects=["pot", "utensil"],
        uncertain_details=["Temperature not visible"]
    )
    assert obs.frame_id == "frame_003.jpg"
    assert len(obs.visible_objects) == 2
    assert obs.timestamp_seconds == 20.0

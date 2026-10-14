import json
from unittest.mock import MagicMock, patch
import pytest
from services.ai.app.reasoning.timeline_generator import generate_cooking_timeline
from services.ai.app.schemas import (
    AudioAnalysisResult,
    FrameObservation,
    SpeechStatus,
    TranscriptSegmentModel,
    VisualAnalysisResult,
)


def test_timeline_evidence_grounding_rejects_fabricated_frames():
    visual_result = VisualAnalysisResult(
        total_frames_extracted=2,
        total_frames_analyzed=2,
        sampling_interval_seconds=10.0,
        observations=[
            FrameObservation(
                frame_id="frame_001.jpg",
                timestamp_seconds=10.0,
                visible_action="Pouring water into pot",
                food_appearance="Clear liquid",
                visible_objects=["pot", "cup"],
                uncertain_details=[]
            ),
            FrameObservation(
                frame_id="frame_002.jpg",
                timestamp_seconds=20.0,
                visible_action="Stirring mixture",
                food_appearance="Thickening paste",
                visible_objects=["pot", "spoon"],
                uncertain_details=[]
            )
        ]
    )

    audio_result = AudioAnalysisResult(
        status=SpeechStatus.NO_USABLE_SPEECH,
        segments=[]
    )

    # Simulated LLM hallucinating a non-existent frame ID "frame_999.jpg"
    mock_llm_response = {
        "events": [
            {
                "title": "Cooking the mixture",
                "description": "Stirring the food on the stove.",
                "evidence_frames": ["frame_002.jpg", "frame_999.jpg"],  # frame_999 does not exist!
                "evidence_transcripts": ["fake_seg_ref"],
                "uncertainties": ["Stirring technique"],
                "question_for_cook": "How long do you stir?"
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"response": json.dumps(mock_llm_response)}

    with patch("httpx.Client.post", return_value=mock_resp):
        timeline = generate_cooking_timeline(visual_result, audio_result, 60.0)

        assert len(timeline.events) == 1
        event = timeline.events[0]

        # Crucial check: "frame_999.jpg" MUST BE FILTERED OUT
        assert "frame_999.jpg" not in event.evidence_frames
        assert event.evidence_frames == ["frame_002.jpg"]

        # Timestamp must be derived from grounded frame: [20.0]
        assert event.observed_timestamps == [20.0]

        # Fake transcript ref must be filtered out
        assert "fake_seg_ref" not in event.evidence_transcripts

        # Verified must be false
        assert event.verified is False


def test_timeline_chronological_ordering():
    visual_result = VisualAnalysisResult(
        total_frames_extracted=3,
        total_frames_analyzed=3,
        sampling_interval_seconds=10.0,
        observations=[
            FrameObservation(frame_id="frame_001.jpg", timestamp_seconds=10.0),
            FrameObservation(frame_id="frame_002.jpg", timestamp_seconds=20.0),
            FrameObservation(frame_id="frame_003.jpg", timestamp_seconds=30.0),
        ]
    )

    audio_result = AudioAnalysisResult(status=SpeechStatus.NO_USABLE_SPEECH, segments=[])

    # LLM returning events out of chronological order
    mock_llm_response = {
        "events": [
            {
                "title": "Later stage",
                "description": "Finished consistency",
                "evidence_frames": ["frame_003.jpg"],
                "uncertainties": [],
                "question_for_cook": "Ready?"
            },
            {
                "title": "Early stage",
                "description": "Initial heating",
                "evidence_frames": ["frame_001.jpg"],
                "uncertainties": [],
                "question_for_cook": "Heat level?"
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"response": json.dumps(mock_llm_response)}

    with patch("httpx.Client.post", return_value=mock_resp):
        timeline = generate_cooking_timeline(visual_result, audio_result, 40.0)

        # First event must be the earlier one (frame_001 at 10.0s)
        assert timeline.events[0].title == "Early stage"
        assert timeline.events[0].position == 0
        assert timeline.events[0].observed_timestamps == [10.0]

        # Second event must be later one (frame_003 at 30.0s)
        assert timeline.events[1].title == "Later stage"
        assert timeline.events[1].position == 1
        assert timeline.events[1].observed_timestamps == [30.0]

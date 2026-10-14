import json
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
from services.ai.app.vision.analyzer import analyze_extracted_frames, analyze_single_frame
from services.ai.app.vision.frame_extractor import ExtractedFrame, extract_video_frames


def test_extract_video_frames_limits(tmp_path):
    # Test frame timestamp planning logic with mocked ffmpeg
    with patch("services.ai.app.vision.frame_extractor.safe_run_subprocess") as mock_subproc:
        mock_subproc.return_value = MagicMock(returncode=0)

        # Mock frame creation
        def side_effect(cmd, timeout_seconds):
            out_file = Path(cmd[-1])
            out_file.write_text("fake_image_bytes")
            return MagicMock(returncode=0)

        mock_subproc.side_effect = side_effect

        dummy_video = tmp_path / "test.mp4"
        dummy_video.write_text("video_content")

        frames = extract_video_frames(
            video_path=dummy_video,
            output_dir=tmp_path / "frames",
            video_duration=50.0,
            interval_seconds=10.0,
            max_frames=4
        )

        # Should extract at 0.0, 10.0, 20.0, 30.0 (capped at max_frames 4)
        assert len(frames) == 4
        assert frames[0].frame_id == "frame_001.jpg"
        assert frames[0].timestamp_seconds == 0.0
        assert frames[1].timestamp_seconds == 10.0
        assert frames[3].timestamp_seconds == 30.0


def test_analyze_single_frame_success(tmp_path):
    frame_file = tmp_path / "frame_001.jpg"
    frame_file.write_bytes(b"dummy_image_data")

    frame = ExtractedFrame("frame_001.jpg", 10.0, frame_file)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "response": json.dumps({
            "visible_action": "Hand holding a wooden spoon",
            "food_appearance": "White viscous liquid in a metal pot",
            "visible_objects": ["spoon", "metal pot"],
            "uncertain_details": ["Whether liquid has begun simmering"]
        })
    }

    mock_client = MagicMock()
    mock_client.post.return_value = mock_resp

    obs = analyze_single_frame(frame, mock_client)
    assert obs is not None
    assert obs.frame_id == "frame_001.jpg"
    assert obs.timestamp_seconds == 10.0
    assert obs.visible_action == "Hand holding a wooden spoon"
    assert "spoon" in obs.visible_objects


def test_analyze_single_frame_invalid_ollama_json(tmp_path):
    frame_file = tmp_path / "frame_002.jpg"
    frame_file.write_bytes(b"dummy_image_data")
    frame = ExtractedFrame("frame_002.jpg", 20.0, frame_file)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"response": "NOT_VALID_JSON_AT_ALL"}

    mock_client = MagicMock()
    mock_client.post.return_value = mock_resp

    # Should not crash, but return a fallback observation highlighting uncertainty
    obs = analyze_single_frame(frame, mock_client, max_retries=1)
    assert obs is not None
    assert obs.frame_id == "frame_002.jpg"
    assert "Model inference error" in obs.uncertain_details[0]

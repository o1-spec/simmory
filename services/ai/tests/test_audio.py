from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
from services.ai.app.audio.extractor import AudioExtractionResult, probe_video_metadata
from services.ai.app.audio.transcriber import (
    is_hallucinated_segment,
    transcribe_audio,
)
from services.ai.app.schemas import SpeechStatus


def test_is_hallucinated_segment_bounds():
    duration = 120.0

    # Normal valid segment
    assert not is_hallucinated_segment("Keep stirring smoothly", 10.0, 15.0, duration)

    # Out of bounds: start >= duration
    assert is_hallucinated_segment("Hello", 125.0, 130.0, duration)

    # Out of bounds: end way beyond duration
    assert is_hallucinated_segment("Hello", 115.0, 125.0, duration)

    # Negative start
    assert is_hallucinated_segment("Hello", -5.0, 10.0, duration)


def test_is_hallucinated_segment_duration_anomaly():
    duration = 200.0

    # 86 seconds for 6 words (reproducing the Tuwo test video bug)
    assert is_hallucinated_segment("This is not my only shelter.", 82.0, 168.0, duration)

    # Known canned silence phrase
    assert is_hallucinated_segment("Thank you for watching", 10.0, 14.0, duration)


def test_transcribe_audio_no_audio_track():
    result = transcribe_audio(
        wav_path=None,
        has_audio_track=False,
        video_duration=100.0
    )
    assert result.status == SpeechStatus.NO_AUDIO_TRACK
    assert len(result.segments) == 0


def test_transcribe_audio_silent_video_hallucination_handling():
    # Mocking Faster-Whisper model returning hallucinated segments on silence
    class MockSegment:
        def __init__(self, start, end, text, avg_logprob=-0.5, no_speech_prob=0.8):
            self.start = start
            self.end = end
            self.text = text
            self.avg_logprob = avg_logprob
            self.no_speech_prob = no_speech_prob

    class MockInfo:
        language = "yo"

    mock_whisper = MagicMock()
    # Return typical silence hallucination output
    mock_whisper.transcribe.return_value = (
        [
            MockSegment(82.0, 168.0, "This is not my only shelter."),
            MockSegment(220.0, 226.0, "Hospital will go online anytime."),  # out of bounds for 217s video
        ],
        MockInfo()
    )

    with patch("services.ai.app.audio.transcriber.get_whisper_model", return_value=mock_whisper):
        dummy_wav = Path("/tmp/dummy_test.wav")
        dummy_wav.touch()
        try:
            result = transcribe_audio(
                wav_path=dummy_wav,
                has_audio_track=True,
                video_duration=217.0
            )
            # Must safely detect that all or most segments were hallucinations and return NO_USABLE_SPEECH
            assert result.status == SpeechStatus.NO_USABLE_SPEECH
            assert len(result.segments) == 0
        finally:
            if dummy_wav.exists():
                dummy_wav.unlink()


def test_transcribe_audio_valid_narration():
    class MockSegment:
        def __init__(self, start, end, text, avg_logprob=-0.2, no_speech_prob=0.01):
            self.start = start
            self.end = end
            self.text = text
            self.avg_logprob = avg_logprob
            self.no_speech_prob = no_speech_prob

    class MockInfo:
        language = "en"

    mock_whisper = MagicMock()
    mock_whisper.transcribe.return_value = (
        [
            MockSegment(5.0, 9.5, "Now we are going to add the warm water gradually."),
            MockSegment(10.0, 14.2, "Stir continuously so lumps do not form.")
        ],
        MockInfo()
    )

    with patch("services.ai.app.audio.transcriber.get_whisper_model", return_value=mock_whisper):
        dummy_wav = Path("/tmp/dummy_valid_test.wav")
        dummy_wav.touch()
        try:
            result = transcribe_audio(
                wav_path=dummy_wav,
                has_audio_track=True,
                video_duration=60.0
            )
            assert result.status == SpeechStatus.USABLE_SPEECH
            assert result.language == "en"
            assert len(result.segments) == 2
            assert result.segments[0].start == 5.0
            assert result.segments[0].end == 9.5
            assert result.segments[1].position == 1
        finally:
            if dummy_wav.exists():
                dummy_wav.unlink()

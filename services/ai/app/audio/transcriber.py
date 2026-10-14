import re
from pathlib import Path
from typing import List, Optional
from ..config import settings
from ..schemas import AudioAnalysisResult, SpeechStatus, TranscriptSegmentModel

_whisper_model_instance = None


def get_whisper_model():
    """
    Lazy singleton loader for Faster-Whisper.
    Avoids loading model on startup or during health checks.
    """
    global _whisper_model_instance
    if _whisper_model_instance is None:
        from faster_whisper import WhisperModel
        _whisper_model_instance = WhisperModel(
            settings.WHISPER_MODEL,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE
        )
    return _whisper_model_instance


# Known hallucination phrases produced by Whisper on silent/low-audio recordings
SUSPICIOUS_PHRASES = {
    "this is not my only shelter",
    "this is the place where i live",
    "thank you for watching",
    "subscribe to my channel",
    "please like and subscribe",
    "subtitles by",
    "translated by",
    "amara.org",
}


def is_hallucinated_segment(
    text: str,
    start: float,
    end: float,
    video_duration: float,
    avg_logprob: float = 0.0,
    no_speech_prob: float = 0.0
) -> bool:
    """
    Evaluates whether a transcript segment is an artifact of Whisper hallucination.
    """
    cleaned = text.strip().lower()
    cleaned = re.sub(r"[^\w\s]", "", cleaned)

    # 1. Out-of-bounds timestamps
    if start >= video_duration or end > (video_duration + 2.0) or start < 0 or end <= start:
        return True

    # 2. Extreme duration anomaly: single segment stretching over 35s with very few words
    duration = end - start
    word_count = len(cleaned.split())
    if duration > 35.0 and word_count < 15:
        return True

    # 3. Low confidence / non-speech indicator (background kitchen noise)
    if avg_logprob < -1.4 or no_speech_prob > 0.5:
        return True

    # 4. Known canned silence hallucinations
    for phrase in SUSPICIOUS_PHRASES:
        if phrase in cleaned:
            return True

    return False


def transcribe_audio(
    wav_path: Optional[Path],
    has_audio_track: bool,
    video_duration: float
) -> AudioAnalysisResult:
    """
    Runs Faster-Whisper transcription and applies strict hallucination checks.
    Guarantees that silent videos or invalid transcripts produce NO_USABLE_SPEECH.
    """
    if not has_audio_track or wav_path is None or not wav_path.exists():
        return AudioAnalysisResult(
            status=SpeechStatus.NO_AUDIO_TRACK,
            language=None,
            segments=[],
            notes="No audio track was detected in the video container."
        )

    try:
        model = get_whisper_model()
        raw_segments, info = model.transcribe(
            str(wav_path),
            beam_size=5,
            vad_filter=True
        )

        detected_language = info.language if info else None
        lang_prob = getattr(info, "language_probability", 1.0) if info else 1.0

        # If language detection confidence is extremely low (< 35%), it indicates non-speech ambient sound
        if lang_prob < 0.35:
            return AudioAnalysisResult(
                status=SpeechStatus.NO_USABLE_SPEECH,
                language=detected_language,
                segments=[],
                notes="Speech recognition confidence is below minimum threshold for intelligible speech."
            )

        collected_segments: List[TranscriptSegmentModel] = []
        hallucination_count = 0
        total_raw_count = 0

        for seg in raw_segments:
            total_raw_count += 1
            start = round(float(seg.start), 2)
            end = round(float(seg.end), 2)
            text = seg.text.strip()
            avg_logprob = getattr(seg, "avg_logprob", 0.0)
            no_speech_prob = getattr(seg, "no_speech_prob", 0.0)

            if not text:
                continue

            if is_hallucinated_segment(text, start, end, video_duration, avg_logprob, no_speech_prob):
                hallucination_count += 1
                continue

            # Ensure valid bounds
            clamped_end = min(end, round(video_duration, 2)) if video_duration > 0 else end
            if clamped_end <= start:
                continue

            needs_review = (avg_logprob < -0.9) or (no_speech_prob > 0.4)

            collected_segments.append(
                TranscriptSegmentModel(
                    start=start,
                    end=clamped_end,
                    text=text,
                    language=detected_language,
                    needs_review=needs_review,
                    position=len(collected_segments)
                )
            )

        # Hallucination safeguards:
        # If all raw segments were hallucinations, or total usable segments is 0
        if total_raw_count == 0 or len(collected_segments) == 0:
            return AudioAnalysisResult(
                status=SpeechStatus.NO_USABLE_SPEECH,
                language=detected_language,
                segments=[],
                notes="Audio stream contained no intelligible speech or narration."
            )

        # If more than 40% of segments were detected as hallucinations
        if total_raw_count > 0 and (hallucination_count / total_raw_count) > 0.35:
            return AudioAnalysisResult(
                status=SpeechStatus.NO_USABLE_SPEECH,
                language=detected_language,
                segments=[],
                notes="Speech recognition indicated background kitchen sound or hallucinated dialogue rather than actual narration."
            )


        return AudioAnalysisResult(
            status=SpeechStatus.USABLE_SPEECH,
            language=detected_language,
            segments=collected_segments,
            notes=None
        )

    except Exception as e:
        return AudioAnalysisResult(
            status=SpeechStatus.TRANSCRIPTION_FAILED,
            language=None,
            segments=[],
            notes=f"Transcription pipeline error: {str(e)}"
        )

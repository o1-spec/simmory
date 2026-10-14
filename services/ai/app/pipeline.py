import logging
from pathlib import Path
from typing import Callable, Optional
from .audio.extractor import extract_audio_wav, probe_video_metadata
from .audio.transcriber import transcribe_audio
from .config import settings
from .reasoning.timeline_generator import generate_cooking_timeline
from .schemas import (
    AIAnalysisResponse,
    AudioAnalysisResult,
    ProcessingStage,
    SpeechStatus,
)
from .utils.cleanup import temporary_workspace
from .vision.analyzer import analyze_extracted_frames
from .vision.frame_extractor import extract_video_frames

logger = logging.getLogger(__name__)


def run_ai_pipeline(
    video_path: Path,
    progress_callback: Optional[Callable[[ProcessingStage], None]] = None
) -> AIAnalysisResponse:
    """
    Executes the end-to-end open-source AI video analysis and recipe reconstruction pipeline:
    1. Media metadata and duration probing
    2. FFmpeg audio extraction & Faster-Whisper transcription with hallucination safeguards
    3. FFmpeg video frame extraction (~10s intervals, bounded resolution)
    4. Ollama Gemma 4 frame-by-frame visual understanding
    5. Grounded cooking timeline synthesis with explicit uncertainty
    """
    if not video_path.exists():
        raise FileNotFoundError(f"Video file does not exist: {video_path}")

    def notify(stage: ProcessingStage):
        if progress_callback:
            try:
                progress_callback(stage)
            except Exception as e:
                logger.warning(f"Error in progress callback for stage {stage}: {e}")

    with temporary_workspace(prefix="simmory_ai_") as workspace:
        # Stage 1: Preparing Media
        notify(ProcessingStage.PREPARING_MEDIA)
        has_audio, duration = probe_video_metadata(video_path)
        logger.info(f"[Pipeline] Video duration={duration:.2f}s, has_audio={has_audio}")

        # Stage 2 & 3: Audio Extraction & Transcription
        notify(ProcessingStage.EXTRACTING_AUDIO)
        wav_path = workspace / "extracted_audio.wav"
        extraction_result = extract_audio_wav(video_path, wav_path)

        notify(ProcessingStage.TRANSCRIBING)
        audio_result: AudioAnalysisResult
        if extraction_result.has_audio and extraction_result.wav_path:
            audio_result = transcribe_audio(
                wav_path=extraction_result.wav_path,
                has_audio_track=True,
                video_duration=duration
            )
        else:
            audio_result = AudioAnalysisResult(
                status=SpeechStatus.NO_AUDIO_TRACK,
                language=None,
                segments=[],
                notes="No audio track was detected in the video container."
            )

        logger.info(
            f"[Pipeline] Audio analysis complete: status={audio_result.status}, "
            f"segments={len(audio_result.segments)}, lang={audio_result.language}"
        )

        # Stage 4: Frame Extraction
        notify(ProcessingStage.EXTRACTING_FRAMES)
        frames_dir = workspace / "frames"
        extracted_frames = extract_video_frames(
            video_path=video_path,
            output_dir=frames_dir,
            video_duration=duration,
            interval_seconds=settings.FRAME_SAMPLING_INTERVAL_SECONDS,
            max_frames=settings.MAX_FRAMES_PER_VIDEO
        )
        logger.info(f"[Pipeline] Extracted {len(extracted_frames)} frames.")

        # Stage 5: Analyzing Frames
        notify(ProcessingStage.ANALYZING_FRAMES)
        vision_result = analyze_extracted_frames(
            frames=extracted_frames,
            sampling_interval=settings.FRAME_SAMPLING_INTERVAL_SECONDS
        )
        logger.info(f"[Pipeline] Analyzed {len(vision_result.observations)} frame observations.")

        # Stage 6: Generating Timeline
        notify(ProcessingStage.GENERATING_TIMELINE)
        timeline_result = generate_cooking_timeline(
            visual_result=vision_result,
            audio_result=audio_result,
            video_duration=duration
        )
        logger.info(f"[Pipeline] Reconstructed {len(timeline_result.events)} cooking events.")

        # Stage 7: Validating Output
        notify(ProcessingStage.VALIDATING_OUTPUT)

        summary_note = (
            f"Analyzed {len(vision_result.observations)} frames across {duration:.1f}s video. "
            f"Reconstructed {len(timeline_result.events)} provisional cooking stages. "
            f"Speech status: {audio_result.status.value}."
        )

        response = AIAnalysisResponse(
            schema_version="1.0.0",
            whisper_model=settings.WHISPER_MODEL,
            vision_model=settings.OLLAMA_MODEL,
            video_duration=round(duration, 2),
            speech_status=audio_result.status,
            detected_language=audio_result.language,
            audio=audio_result,
            vision=vision_result,
            timeline=timeline_result,
            summary=summary_note
        )

        notify(ProcessingStage.COMPLETED)
        return response

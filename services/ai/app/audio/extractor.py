import os
import shutil
from pathlib import Path
from typing import Optional, Tuple
from ..utils.security import safe_run_subprocess


class AudioExtractionResult:
    def __init__(self, has_audio: bool, duration: float, wav_path: Optional[Path] = None, error: Optional[str] = None):
        self.has_audio = has_audio
        self.duration = duration
        self.wav_path = wav_path
        self.error = error


def probe_video_metadata(video_path: Path) -> Tuple[bool, float]:
    """
    Checks if the video has an audio stream and retrieves its duration.
    """
    ffprobe_bin = shutil.which("ffprobe") or "ffprobe"

    # 1. Get video duration
    dur_cmd = [
        ffprobe_bin,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video_path)
    ]
    dur_proc = safe_run_subprocess(dur_cmd, timeout_seconds=15.0)
    duration = 0.0
    if dur_proc.returncode == 0 and dur_proc.stdout.strip():
        try:
            duration = float(dur_proc.stdout.strip())
        except ValueError:
            duration = 0.0

    # 2. Check for audio stream
    audio_cmd = [
        ffprobe_bin,
        "-v", "error",
        "-select_streams", "a:0",
        "-show_entries", "stream=codec_name",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video_path)
    ]
    audio_proc = safe_run_subprocess(audio_cmd, timeout_seconds=15.0)
    has_audio_stream = audio_proc.returncode == 0 and bool(audio_proc.stdout.strip())

    return has_audio_stream, duration


def extract_audio_wav(video_path: Path, output_wav_path: Path) -> AudioExtractionResult:
    """
    Extracts a 16kHz mono WAV file from the video using FFmpeg.
    """
    if not video_path.exists():
        return AudioExtractionResult(
            has_audio=False,
            duration=0.0,
            error=f"Source video file not found: {video_path}"
        )

    has_audio_stream, duration = probe_video_metadata(video_path)
    if not has_audio_stream:
        return AudioExtractionResult(
            has_audio=False,
            duration=duration,
            error="Video contains no audio stream"
        )

    ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(video_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(output_wav_path)
    ]

    proc = safe_run_subprocess(cmd, timeout_seconds=60.0)
    if proc.returncode != 0 or not output_wav_path.exists():
        return AudioExtractionResult(
            has_audio=False,
            duration=duration,
            error=f"FFmpeg audio extraction failed: {proc.stderr.strip()}"
        )

    # Check WAV file size (standard WAV header is 44 bytes; if <= 44 bytes, audio is empty)
    if output_wav_path.stat().st_size <= 44:
        return AudioExtractionResult(
            has_audio=False,
            duration=duration,
            error="Extracted audio stream is empty (0 samples)"
        )

    return AudioExtractionResult(
        has_audio=True,
        duration=duration,
        wav_path=output_wav_path
    )

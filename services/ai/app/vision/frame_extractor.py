import shutil
from pathlib import Path
from typing import List
from ..config import settings
from ..utils.security import safe_run_subprocess


class ExtractedFrame:
    def __init__(self, frame_id: str, timestamp_seconds: float, image_path: Path):
        self.frame_id = frame_id
        self.timestamp_seconds = timestamp_seconds
        self.image_path = image_path


def extract_video_frames(
    video_path: Path,
    output_dir: Path,
    video_duration: float,
    interval_seconds: float = 10.0,
    max_frames: int = 30
) -> List[ExtractedFrame]:
    """
    Extracts video frames at regular intervals with exact timestamps.
    Applies resolution scaling (max 640px) to bound memory during Gemma inference.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

    # Determine extraction timestamps
    duration = min(video_duration, settings.MAX_VIDEO_DURATION_SECONDS)
    if duration <= 0:
        duration = 10.0  # fallback minimal duration

    timestamps: List[float] = []
    current_t = 0.0
    while current_t < duration and len(timestamps) < max_frames:
        timestamps.append(round(current_t, 2))
        current_t += interval_seconds

    extracted: List[ExtractedFrame] = []

    for idx, t in enumerate(timestamps, start=1):
        frame_id = f"frame_{idx:03d}.jpg"
        frame_path = output_dir / frame_id

        # Fast seek to timestamp t and extract single scaled frame
        cmd = [
            ffmpeg_bin,
            "-y",
            "-ss", str(t),
            "-i", str(video_path),
            "-frames:v", "1",
            "-q:v", "2",
            "-vf", "scale=min(640\\,iw):-1",
            str(frame_path)
        ]

        proc = safe_run_subprocess(cmd, timeout_seconds=20.0)
        if proc.returncode == 0 and frame_path.exists() and frame_path.stat().st_size > 0:
            extracted.append(
                ExtractedFrame(
                    frame_id=frame_id,
                    timestamp_seconds=t,
                    image_path=frame_path
                )
            )

    return extracted

import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..config import settings
from ..utils.security import safe_run_subprocess


class ExtractedFrame:
    def __init__(self, frame_id: str, timestamp_seconds: float, image_path: Path):
        self.frame_id = frame_id
        self.timestamp_seconds = timestamp_seconds
        self.image_path = image_path


class ExtractedFrameCollection(list):
    """
    List of ExtractedFrame with attached sampling metadata for coverage analysis.
    """
    def __init__(self, frames: List[ExtractedFrame], metadata: Dict[str, Any]):
        super().__init__(frames)
        self.metadata = metadata


def calculate_sampling_timestamps(
    duration: float,
    interval_seconds: float = 10.0,
    max_frames: int = 30
) -> (List[float], str):
    """
    Calculates frame timestamps ensuring full-video coverage.
    If fixed intervals would exceed max_frames, spreads samples uniformly across the entire duration.
    """
    duration = max(duration, 1.0)
    
    # If the video fits within max_frames at fixed intervals
    potential_frames_at_fixed = int(duration // interval_seconds) + 1
    if potential_frames_at_fixed <= max_frames:
        strategy = "fixed_interval"
        timestamps = []
        current_t = 0.0
        while current_t <= duration and len(timestamps) < max_frames:
            timestamps.append(round(current_t, 2))
            current_t += interval_seconds
        # Ensure we don't have an empty list
        if not timestamps:
            timestamps = [0.0]
        return timestamps, strategy

    # Capped frame count: spread uniformly across full duration to sample early, middle, and late
    strategy = "uniform_full_coverage"
    if max_frames <= 1:
        return [0.0], strategy

    # Sample uniformly from 0 to near the end of the video
    end_bound = max(0.0, duration - 0.5)
    step = end_bound / (max_frames - 1)
    timestamps = [round(i * step, 2) for i in range(max_frames)]
    return timestamps, strategy


def extract_video_frames(
    video_path: Path,
    output_dir: Path,
    video_duration: float,
    interval_seconds: float = 10.0,
    max_frames: int = 30
) -> ExtractedFrameCollection:
    """
    Extracts video frames ensuring full-video coverage with exact timestamps.
    Applies resolution scaling (max 640px) to bound memory during Gemma inference.
    Preserves sampling strategy and coverage metadata.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

    duration = min(video_duration, settings.MAX_VIDEO_DURATION_SECONDS)
    if duration <= 0:
        duration = 10.0  # fallback minimal duration

    timestamps, strategy = calculate_sampling_timestamps(
        duration=duration,
        interval_seconds=interval_seconds,
        max_frames=max_frames
    )

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

    time_range = [extracted[0].timestamp_seconds, extracted[-1].timestamp_seconds] if extracted else [0.0, 0.0]
    coverage_ratio = round((time_range[1] - time_range[0]) / max(duration, 1.0), 3) if extracted else 0.0

    metadata = {
        "video_duration": round(duration, 2),
        "sampling_strategy": strategy,
        "sampled_time_range": time_range,
        "total_frames_extracted": len(extracted),
        "coverage_ratio": coverage_ratio,
        "early_timestamp": time_range[0],
        "late_timestamp": time_range[1],
        "configured_max_frames": max_frames,
    }

    return ExtractedFrameCollection(extracted, metadata)


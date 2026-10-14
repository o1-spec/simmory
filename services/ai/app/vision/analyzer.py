import base64
import json
import logging
from typing import List, Optional
import httpx
from ..config import settings
from ..schemas import FrameObservation, VisualAnalysisResult
from .frame_extractor import ExtractedFrame

logger = logging.getLogger(__name__)

FRAME_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "visible_action": {"type": "string"},
        "food_appearance": {"type": "string"},
        "visible_objects": {
            "type": "array",
            "items": {"type": "string"}
        },
        "uncertain_details": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": [
        "visible_action",
        "food_appearance",
        "visible_objects",
        "uncertain_details"
    ]
}

FRAME_ANALYSIS_PROMPT = """
You analyze ONE cooking video frame for Simmory.

Describe only what is directly visible.
Do not identify the dish unless visually certain.
Do not invent ingredients, quantities, temperatures, past actions, future actions, or cooking stages.

If an action cannot be determined, say so.
If food texture is unclear, say so.

Return the requested JSON structure.
"""


def analyze_single_frame(
    frame: ExtractedFrame,
    client: httpx.Client,
    max_retries: int = 2
) -> Optional[FrameObservation]:
    """
    Submits a single frame image to Ollama Gemma 4 with structured JSON format.
    """
    if not frame.image_path.exists():
        return None

    image_b64 = base64.b64encode(frame.image_path.read_bytes()).decode("utf-8")

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": FRAME_ANALYSIS_PROMPT,
        "images": [image_b64],
        "stream": False,
        "format": FRAME_ANALYSIS_SCHEMA,
        "options": {"temperature": 0}
    }

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"

    for attempt in range(1, max_retries + 1):
        try:
            resp = client.post(url, json=payload, timeout=settings.OLLAMA_REQUEST_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            raw_response = data.get("response", "{}")
            parsed = json.loads(raw_response)

            return FrameObservation(
                frame_id=frame.frame_id,
                timestamp_seconds=frame.timestamp_seconds,
                visible_action=parsed.get("visible_action"),
                food_appearance=parsed.get("food_appearance"),
                visible_objects=parsed.get("visible_objects", []),
                uncertain_details=parsed.get("uncertain_details", [])
            )
        except Exception as err:
            logger.warning(
                f"[Vision] Attempt {attempt} failed analyzing {frame.frame_id}: {err}"
            )
            if attempt == max_retries:
                # Fallback observation with explicit uncertainty note
                return FrameObservation(
                    frame_id=frame.frame_id,
                    timestamp_seconds=frame.timestamp_seconds,
                    visible_action=None,
                    food_appearance="Visual observation unavailable during model inference",
                    visible_objects=[],
                    uncertain_details=["Model inference error on this frame"]
                )

    return None


def analyze_extracted_frames(
    frames: List[ExtractedFrame],
    sampling_interval: float
) -> VisualAnalysisResult:
    """
    Analyzes extracted frames sequentially to avoid overloading local Apple Silicon RAM.
    Preserves sampling strategy and coverage metadata.
    """
    observations: List[FrameObservation] = []

    with httpx.Client(timeout=settings.OLLAMA_REQUEST_TIMEOUT) as client:
        for frame in frames:
            obs = analyze_single_frame(frame, client)
            if obs:
                observations.append(obs)

    metadata = getattr(frames, "metadata", {})
    sampling_strategy = metadata.get("sampling_strategy", "fixed_interval")
    sampled_time_range = metadata.get("sampled_time_range", [frames[0].timestamp_seconds, frames[-1].timestamp_seconds] if frames else [])
    coverage_ratio = metadata.get("coverage_ratio", 1.0)

    return VisualAnalysisResult(
        total_frames_extracted=len(frames),
        total_frames_analyzed=len(observations),
        sampling_interval_seconds=sampling_interval,
        sampling_strategy=sampling_strategy,
        sampled_time_range=sampled_time_range,
        coverage_ratio=coverage_ratio,
        observations=observations
    )


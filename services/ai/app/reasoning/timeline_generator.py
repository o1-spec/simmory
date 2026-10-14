import json
import logging
from typing import Dict, List, Optional
import httpx
from ..config import settings
from ..schemas import (
    AudioAnalysisResult,
    ProposedEventModel,
    SpeechStatus,
    TimelineReconstructionResult,
    VisualAnalysisResult,
)

logger = logging.getLogger(__name__)

TIMELINE_SCHEMA = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "evidence_frames": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "evidence_transcripts": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "uncertainties": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "question_for_cook": {
                        "type": "string"
                    }
                },
                "required": [
                    "title",
                    "description",
                    "evidence_frames",
                    "uncertainties",
                    "question_for_cook"
                ]
            }
        }
    },
    "required": ["events"]
}


def build_timeline_prompt(
    visual_result: VisualAnalysisResult,
    audio_result: AudioAnalysisResult,
    video_duration: float
) -> str:
    obs_summary = [
        {
            "frame_id": obs.frame_id,
            "timestamp_seconds": obs.timestamp_seconds,
            "visible_action": obs.visible_action,
            "food_appearance": obs.food_appearance,
            "visible_objects": obs.visible_objects,
            "uncertain_details": obs.uncertain_details,
        }
        for obs in visual_result.observations
    ]

    has_usable_speech = (
        audio_result.status == SpeechStatus.USABLE_SPEECH
        and len(audio_result.segments) > 0
    )

    if has_usable_speech:
        transcript_summary = [
            {
                "ref": f"seg_{seg.position}",
                "start": seg.start,
                "end": seg.end,
                "text": seg.text,
            }
            for seg in audio_result.segments
        ]
        audio_mode_text = f"""
MODE: Narrated Cooking Video.
The video contains genuine speech narration.
You may cross-reference visible actions with spoken instructions.
TRANSCRIPT SEGMENTS:
{json.dumps(transcript_summary, indent=2)}
"""
    else:
        audio_mode_text = """
MODE: Silent / Non-narrated Cooking Video.
The original video contains no usable speech narration.
DO NOT fabricate spoken dialogue or recipe steps from imagined speech.
Your events must be based STRICTLY on visible observations.
"""

    prompt = f"""
You are Simmory's cooking-video analysis and recipe reconstruction engine.

Your task:
- Group related observations into 2 to 5 meaningful chronological cooking events or stages.
- Ground every event in real evidence: reference exact frame_id values from the OBSERVATIONS list.
- If speech transcript is provided, reference the exact segment 'ref' values.
- Never invent frame IDs, transcript references, or timestamps.
- Never claim ingredients, quantities, cooking temperatures, or stirrings unless directly visible.
- Highlight uncertainties and ask a thoughtful question for the cook when cooking details are missing.

{audio_mode_text}

VIDEO DURATION: {video_duration:.1f} seconds.

OBSERVATIONS:
{json.dumps(obs_summary, indent=2)}
"""
    return prompt


def generate_cooking_timeline(
    visual_result: VisualAnalysisResult,
    audio_result: AudioAnalysisResult,
    video_duration: float
) -> TimelineReconstructionResult:
    """
    Synthesizes visual observations and optional audio transcripts into a grounded timeline.
    Validates all evidence references against actual extracted frame IDs and segment refs.
    """
    if not visual_result.observations:
        return TimelineReconstructionResult(
            events=[],
            status="needs_human_review",
            source_type="visual_only"
        )

    # Map of valid frame_id -> timestamp
    frame_timestamps: Dict[str, float] = {
        obs.frame_id: obs.timestamp_seconds
        for obs in visual_result.observations
    }

    # Map of valid transcript refs
    valid_transcript_refs = {
        f"seg_{seg.position}" for seg in audio_result.segments
    }

    prompt = build_timeline_prompt(visual_result, audio_result, video_duration)
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "format": TIMELINE_SCHEMA,
        "stream": False,
        "options": {"temperature": 0}
    }

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"

    raw_events: List[dict] = []
    try:
        with httpx.Client(timeout=settings.OLLAMA_REQUEST_TIMEOUT) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            parsed = json.loads(data.get("response", "{}"))
            raw_events = parsed.get("events", [])
    except Exception as err:
        logger.error(f"[Timeline] Ollama timeline generation call failed: {err}")
        # Fallback heuristic grouping if LLM call fails
        raw_events = []

    # If LLM didn't return valid events, generate baseline grounded events directly from observations
    if not raw_events:
        # Group observations into 2-3 chronological buckets
        chunk_size = max(1, len(visual_result.observations) // 2)
        for chunk_idx, i in enumerate(range(0, len(visual_result.observations), chunk_size)):
            chunk = visual_result.observations[i:i + chunk_size]
            frames = [c.frame_id for c in chunk]
            first_obs = chunk[0]
            raw_events.append({
                "title": f"Cooking Stage {chunk_idx + 1}",
                "description": first_obs.food_appearance or "Visible food preparation in progress.",
                "evidence_frames": frames,
                "evidence_transcripts": [],
                "uncertainties": first_obs.uncertain_details or ["Unconfirmed ingredients and technique"],
                "question_for_cook": "What steps were performed during this stage of preparation?"
            })

    # Grounding and Validation:
    validated_events: List[ProposedEventModel] = []

    for item in raw_events:
        # 1. Filter evidence_frames to ONLY those that actually exist in frame_timestamps
        candidate_frames = item.get("evidence_frames", [])
        grounded_frames = [f for f in candidate_frames if f in frame_timestamps]

        # If LLM hallucinated all frame IDs, attach the closest valid frame
        if not grounded_frames and visual_result.observations:
            grounded_frames = [visual_result.observations[0].frame_id]

        # 2. Derive observed timestamps directly from grounded frame metadata
        observed_timestamps = sorted(list({frame_timestamps[f] for f in grounded_frames}))

        # 3. Filter evidence_transcripts to valid refs
        candidate_transcripts = item.get("evidence_transcripts", [])
        grounded_transcripts = [t for t in candidate_transcripts if t in valid_transcript_refs]

        # 4. Clean uncertainties and questions
        uncertainties = item.get("uncertainties", [])
        if not isinstance(uncertainties, list) or len(uncertainties) == 0:
            uncertainties = ["Specific ingredients and heat settings require confirmation."]

        question = item.get("question_for_cook") or "How do you determine when this step is complete?"

        validated_events.append(
            ProposedEventModel(
                position=len(validated_events),
                title=item.get("title", f"Stage {len(validated_events) + 1}"),
                description=item.get("description", "Visible cooking activity observed."),
                evidence_frames=grounded_frames,
                evidence_transcripts=grounded_transcripts,
                observed_timestamps=observed_timestamps,
                uncertainties=uncertainties,
                question_for_cook=question,
                verified=False  # Crucial: NEVER pre-verify AI-generated proposed events
            )
        )

    # Sort events chronologically by their earliest observed timestamp
    validated_events.sort(key=lambda e: (e.observed_timestamps[0] if e.observed_timestamps else 0.0))

    # Re-index sequential positions
    for idx, ev in enumerate(validated_events):
        ev.position = idx

    source_type = (
        "audio_visual"
        if audio_result.status == SpeechStatus.USABLE_SPEECH and audio_result.segments
        else "visual_only"
    )

    return TimelineReconstructionResult(
        events=validated_events,
        status="needs_human_review",
        source_type=source_type
    )

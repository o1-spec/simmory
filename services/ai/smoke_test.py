#!/usr/bin/env python3
"""
Simmory Phase 6: Real Local AI Inference Smoke Test.

This opt-in script exercises the real, end-to-end local AI pipeline using:
1. Locally installed FFmpeg & FFprobe
2. Locally installed Faster-Whisper (small, CPU int8)
3. Locally running Ollama instance with gemma4:e4b-it-qat
4. A real cooking demonstration video (e.g. ../simmory-ai/cooking.mp4)

Usage:
  PYTHONPATH=. ./services/ai/.venv/bin/python services/ai/smoke_test.py [path_to_video.mp4]
"""

import json
import os
import shutil
import sys
from pathlib import Path
import httpx
from services.ai.app.config import settings
from services.ai.app.pipeline import run_ai_pipeline
from services.ai.app.schemas import ProcessingStage, SpeechStatus


def main():
    print("=" * 60)
    print("  SIMMORY PHASE 6: REAL LOCAL AI INFERENCE SMOKE TEST  ")
    print("=" * 60)

    # 1. Check FFmpeg and FFprobe
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        print("[BLOCKER] FFmpeg or FFprobe is not installed on PATH.")
        sys.exit(1)
    print(f"[OK] FFmpeg found: {ffmpeg}")
    print(f"[OK] FFprobe found: {ffprobe}")

    # 2. Check Ollama and Gemma 4
    try:
        resp = httpx.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags", timeout=5.0)
        if resp.status_code != 200:
            print(f"[BLOCKER] Ollama returned HTTP {resp.status_code}")
            sys.exit(1)
        data = resp.json()
        models = [m.get("name") for m in data.get("models", [])]
        has_gemma = any(settings.OLLAMA_MODEL in m or m.startswith(settings.OLLAMA_MODEL) for m in models)
        if not has_gemma:
            print(f"[BLOCKER] Ollama is running, but model '{settings.OLLAMA_MODEL}' is missing. Installed models: {models}")
            sys.exit(1)
        print(f"[OK] Ollama is active with model: {settings.OLLAMA_MODEL}")
    except Exception as e:
        print(f"[BLOCKER] Could not connect to Ollama at {settings.OLLAMA_BASE_URL}: {e}")
        sys.exit(1)

    # 3. Locate Video Fixture
    video_path: Path
    if len(sys.argv) > 1:
        video_path = Path(sys.argv[1]).resolve()
    else:
        # Check standard locations
        candidates = [
            Path("../simmory-ai/cooking.mp4").resolve(),
            Path("services/ai/tests/fixtures/cooking.mp4").resolve(),
            Path("tests/fixtures/sample-cooking.mp4").resolve(),
        ]
        found = [c for c in candidates if c.exists()]
        if not found:
            print(f"[BLOCKER] No video fixture found. Checked: {[str(c) for c in candidates]}")
            sys.exit(1)
        video_path = found[0]

    print(f"[OK] Using video fixture: {video_path} ({video_path.stat().st_size / (1024*1024):.2f} MB)")

    # 4. Progress tracker
    def on_progress(stage: ProcessingStage):
        print(f" -> Stage: {stage.value}", flush=True)

    print("\n--- Executing Real Inference Pipeline ---")
    try:
        result = run_ai_pipeline(video_path, progress_callback=on_progress)
    except Exception as e:
        print(f"\n[FAIL] Pipeline execution failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # 5. Verify Output Integrity
    print("\n--- Inference Results Verification ---")
    print(f"Video Duration: {result.video_duration:.2f}s")
    print(f"Speech Status: {result.speech_status}")
    print(f"Detected Language: {result.detected_language}")
    print(f"Extracted Frames: {result.vision.total_frames_extracted}")
    print(f"Analyzed Observations: {result.vision.total_frames_analyzed}")
    print(f"Reconstructed Events: {len(result.timeline.events)}")

    # Verification: Silent video check
    if "cooking.mp4" in video_path.name.lower():
        # The known Tuwo cooking video is silent/non-narrated
        if result.speech_status != SpeechStatus.NO_USABLE_SPEECH:
            print(f"[WARNING] Expected NO_USABLE_SPEECH for silent footage, got: {result.speech_status}")
        else:
            print("[PASS] Hallucination Safeguard Verified: Silent footage successfully produced NO_USABLE_SPEECH.")

    # Verification: Events & Grounding
    assert len(result.timeline.events) > 0, "Pipeline must reconstruct at least one cooking event"
    for ev in result.timeline.events:
        assert ev.verified is False, "Events must NEVER be pre-verified"
        assert len(ev.evidence_frames) > 0, f"Event '{ev.title}' lacks evidence frames"
        assert len(ev.observed_timestamps) > 0, f"Event '{ev.title}' lacks ground-truth timestamps"

    print("[PASS] Grounded Timeline Verification: All events reference valid evidence with verified=False.")
    print("\nProposed Events:")
    for ev in result.timeline.events:
        ts_str = ", ".join(f"{t:.1f}s" for t in ev.observed_timestamps)
        print(f" - [{ts_str}] {ev.title}")
        print(f"   Evidence frames: {ev.evidence_frames}")
        print(f"   Question for cook: {ev.question_for_cook}")

    print("\n" + "=" * 60)
    print("  REAL LOCAL INFERENCE SMOKE TEST COMPLETED SUCCESSFULLY!  ")
    print("=" * 60)


if __name__ == "__main__":
    main()

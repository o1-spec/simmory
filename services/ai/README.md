# Simmory AI Service

Standalone Python service for local, open-source video analysis and recipe reconstruction.

## Key Capabilities

- **Audio Extraction & Speech Transcription**: FFmpeg extraction coupled with Faster-Whisper (`small`, CPU `int8`) and explicit hallucination detection (flags silent videos as `NO_USABLE_SPEECH`).
- **Video Frame Sampling**: Regular extraction (~10s intervals) with exact video timestamps and 640px bounded resolution.
- **Visual Understanding**: Local Ollama inference using `gemma4:e4b-it-qat` with structured JSON schema.
- **Cooking Timeline Reconstruction**: Synthesizes chronological proposed events with strict evidence grounding and unanswered questions for the family cook.
- **Zero Pre-Verification**: Proposed cooking events are never pre-verified.

## Setup & Running

```bash
# 1. Create and activate virtual environment
python3 -m venv services/ai/.venv
source services/ai/.venv/bin/activate

# 2. Install dependencies
pip install -r services/ai/requirements.txt

# 3. Start service
python -m uvicorn services.ai.app.main:app --host 127.0.0.1 --port 8001
```

## Health Check

```bash
curl http://127.0.0.1:8001/health
```

# Simmory AI Video Analysis & Recipe Reconstruction

This document describes the architectural design, implementation details, operational procedures, and security model of Simmory's Phase 6 AI processing pipeline.

---

## 1. Architectural Overview

Simmory preserves unwritten family culinary heritage through an open-source, multi-modal, evidence-grounded AI reconstruction pipeline.

```text
Next.js Application (App Router)
        │  POST /api/videos/[id]/analyze
        ▼
PostgreSQL (ProcessingJob / Transactional Outbox)
        │
        ▼ (OutboxDispatcher polling)
BullMQ "ai-analysis" Queue (Redis)
        │
        ▼ (Concurrency: 1)
Node.js Background Worker
        │
        ├─► S3 / Cloudflare R2 / Local Storage (Stream download)
        │
        ▼ Authenticated HTTP Loopback (X-Simmory-Internal-Key)
Standalone Python AI Service (FastAPI on 127.0.0.1:8001)
        │
        ├── FFprobe & FFmpeg
        │     ├─ Audio stream detection & 16kHz mono WAV extraction
        │     └─ Frame sampling (~10s intervals, max 640px bounded resolution)
        │
        ├── Faster-Whisper (small, CPU, int8)
        │     └─ Multilingual VAD transcription with strict hallucination checks
        │
        └── Ollama (gemma4:e4b-it-qat)
              ├─ Independent frame-by-frame visual understanding (structured JSON)
              └─ Grounded chronological cooking timeline reasoning
        │
        ▼ Validated AIAnalysisResponse (Pydantic)
PostgreSQL
  ├── AIAnalysis (status: COMPLETED)
  ├── TranscriptSegment (timestamped, needsReview flag)
  ├── VisualObservation (frame_id, timestamp, structured cues)
  └── ProposedCookingEvent (strictly grounded, verified: false)
```

---

## 2. Python Environment & Dependencies

### Python Requirements
- **Python Version**: 3.13+ (tested on Python 3.13.13 on Apple Silicon macOS).
- **Virtual Environment**: Isolated in `services/ai/.venv` (ignored by Git).

### Core Libraries
- **FastAPI** (`0.143.0`) & **Uvicorn** (`0.54.0`): Lightweight HTTP microservice.
- **Pydantic** (`2.14.1`): Strict request/response validation and verification guards.
- **Faster-Whisper** (`1.2.1`) & **CTranslate2** (`4.8.3`): Efficient CPU-quantized speech recognition (`int8`).
- **PyAV** (`18.1.0`): Compatible audio/video container bindings.
- **HTTPX** (`0.28.1`): Asynchronous HTTP client communicating with Ollama.
- **FFmpeg & FFprobe**: System-level binaries for container inspection, audio extraction, and frame sampling.

### Installation

```bash
# From workspace root
python3 -m venv services/ai/.venv
source services/ai/.venv/bin/activate
pip install -r services/ai/requirements.txt
```

---

## 3. Ollama & Gemma 4 Setup

Simmory uses the open-source Gemma 4 vision-language model running locally via Ollama:

1. Install Ollama: `brew install ollama` (macOS) or download from [ollama.com](https://ollama.com).
2. Pull the specified quantized model:
   ```bash
   ollama pull gemma4:e4b-it-qat
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```
   (Runs on `http://127.0.0.1:11434` by default).

---

## 4. How to Start the Services Locally

### Terminal 1: Python AI Service
```bash
source services/ai/.venv/bin/activate
python -m uvicorn services.ai.app.main:app --host 127.0.0.1 --port 8001
```

Verify service health:
```bash
curl http://127.0.0.1:8001/health
```

### Terminal 2: Node.js Background Worker & Outbox Dispatcher
```bash
npm run worker
```

### Terminal 3: Next.js Web Application
```bash
npm run dev
```

---

## 5. Job Lifecycle & Reliability

1. **User Trigger**: An authorized `OWNER` or `EDITOR` clicks **"Analyze Video with AI"** on `/videos/[id]`.
2. **Pre-condition Validation**:
   - Video upload status must be `UPLOADED`.
   - Video media stream validation must be `VALIDATED` (FFprobe passed).
   - Duplicate active jobs are prevented via partial index and status checks.
3. **Transactional Outbox**:
   - `ProcessingJob` is created with `jobType: "AI_ANALYSIS"`, `status: "PENDING_DISPATCH"`.
   - Video `processingStatus` transitions to `QUEUED`.
4. **Outbox Dispatcher**:
   - Periodically polls for `PENDING_DISPATCH` jobs.
   - Dispatches jobs to BullMQ queue `ai-analysis` with deterministic ID `ai-analysis-{jobId}`.
   - Atomically updates job status to `QUEUED`.
5. **Worker Execution**:
   - Worker consumes job with bounded concurrency (`1` for local development).
   - Video media is streamed/downloaded to a secure temporary file in `os.tmpdir()`.
   - Worker updates progress periodically to maintain BullMQ lock.
   - Calls Python AI service over loopback with `X-Simmory-Internal-Key`.
   - Results are saved atomically in PostgreSQL (`AIAnalysis`, `TranscriptSegment`, `VisualObservation`, `ProposedCookingEvent`).
   - Temporary files are guaranteed to be cleaned up in a `finally` block.

---

## 6. Hallucination Safeguards & Speech Processing

### The Silence Hallucination Failure Mode
During proof-of-concept testing with a silent 3-minute-38-second Tuwo cooking demonstration, Whisper incorrectly detected Yoruba (`yo`) and hallucinated fabricated dialogue (e.g. *"This is not my only shelter."*) with timestamps exceeding the video duration.

### Simmory Safeguards
1. **Audio Track Probe**: FFprobe detects whether an audio stream exists. If missing, `status` is set to `NO_AUDIO_TRACK`.
2. **Timestamp Bound Checks**: Segments with `start < 0`, `start >= duration`, or `end > duration + 2.0s` are flagged and discarded.
3. **Duration Anomaly Detection**: Any single segment lasting > 40 seconds with fewer than 15 words is treated as silence decoding stuck and discarded.
4. **Suspicious Phrase Filter**: Common silence hallucination phrases (e.g. *"This is not my only shelter"*, *"Thank you for watching"*) are detected and pruned.
5. **Majority Hallucination Threshold**: If over 40% of generated segments are invalid or anomalous, the system classifies the audio as `NO_USABLE_SPEECH`.
6. **Explicit User Communication**: Silent videos display a clear notification:
   > *"No usable narration was detected. Simmory analyzed the visible cooking activity instead."*

---

## 7. Frame Extraction & Visual Understanding

1. **Sampling Frequency**: Frames are sampled every 10 seconds (`FRAME_SAMPLING_INTERVAL_SECONDS = 10.0`).
2. **Max Frame Cap**: Bounded at 30 frames (`MAX_FRAMES_PER_VIDEO = 30`) to control memory and inference time.
3. **Bounded Resolution**: Scaled via FFmpeg to max width 640px (`scale=min(640\,iw):-1`) to avoid RAM bloat on local GPUs/CPUs.
4. **Independent Analysis**: Frames are analyzed individually with Gemma 4 using structured JSON schema. This avoids cross-frame hallucination where the model invents color transitions or step progression.
5. **Explicit Uncertainty**: Visible actions, utensils, and food textures are captured; unconfirmed elements are explicitly recorded in `uncertain_details`.

---

## 8. Grounded Cooking Timeline Reconstruction

The timeline reasoning stage synthesizes visual observations and speech transcripts into candidate cooking events:

1. **Ground-Truth Timestamps**: Observed timestamps are derived strictly from the timestamps of verified frames.
2. **Evidence Validation**:
   - Python-side validation checks every entry in `evidence_frames`. Any hallucinated frame ID (e.g. `frame_999.jpg`) is filtered out.
   - Transcript references are verified against real segment IDs.
3. **Chronological Sorting**: Events are ordered chronologically by their earliest observed evidence timestamp.
4. **Clarification Questions**: Unclear heat levels, ingredient identities, and completion cues generate explicit questions for the family cook.
5. **Zero Pre-Verification**: Every reconstructed event has `verified: false`. Human review in Phase 7 is required before any step is considered verified.

---

## 9. Interactive Evidence Playback

On `/videos/[id]`, users can click any evidence timestamp badge on a proposed cooking event (e.g. `▶ 0:20`, `▶ 1:40`). The video player immediately jumps to that exact moment, allowing family members to verify visual cues against the original video.

---

## 10. Local Resource Management

- **Memory**: Max concurrency is bounded to 1. Image frames are scaled to 640px and analyzed sequentially.
- **Disk Usage**: Extracted audio WAV files and video frames are written to temporary working directories and deleted immediately upon pipeline completion.
- **Model Caching**: Faster-Whisper is loaded lazily once and cached in memory.

---

## 11. Running the Opt-in Smoke Test

To verify the real local AI inference pipeline against a real cooking video:

```bash
MAX_FRAMES_PER_VIDEO=6 PYTHONPATH=. ./services/ai/.venv/bin/python services/ai/smoke_test.py ../simmory-ai/cooking.mp4
```

---

## 12. Future Cloud AI Deployment Strategy

When deploying the Node.js worker to hosted environments (e.g. Render):
- A Render worker cannot reach Ollama on a developer's Mac via `localhost`.
- **Production Architecture**: Deploy the Python AI service as an independent private container on a GPU-enabled host (e.g., RunPod, AWS EC2 G5, or GCP Cloud Run with GPU).
- Secure communication via mutual TLS (mTLS) or private VPC networking with authenticated service-to-service bearer tokens (`X-Simmory-Internal-Key`).
- Media transfer using temporary presigned S3/R2 read streams directly into the AI container.

# Simmory — Background Processing & Media Worker Architecture (Phase 5)

## 1. Architectural Overview

Simmory handles media processing asynchronously to preserve application responsiveness and accommodate the resource constraints of serverless and containerized deployment targets (Vercel for Next.js, Render for Background Workers and Key Value instances).

### Separation of Responsibilities
1. **Next.js Web Application (Vercel / Node.js)**:
   - Authenticates users via HttpOnly JWT cookies.
   - Authorizes family kitchen mutations (`OWNER`, `EDITOR`, `VIEWER`).
   - Issues short-lived presigned upload and playback URLs.
   - Transactionally records uploads and creates pending outbox job records in PostgreSQL.
   - Exposes authenticated polling and retry endpoints.
2. **PostgreSQL (System of Record & Transactional Outbox)**:
   - Serves as the single permanent source of truth for all videos, kitchen associations, and job states.
   - Enforces unique database constraints preventing duplicate active jobs.
3. **Redis / Valkey (BullMQ Execution Queue)**:
   - Ephemeral, high-throughput task broker.
   - Configured with `maxmemory-policy: noeviction` to ensure jobs are never evicted under memory pressure.
4. **Standalone Background Worker (Render / Node.js)**:
   - Runs an independent transactional outbox dispatcher loop.
   - Executes BullMQ consumers for `video-validation`.
   - Downloads media to bounded temporary storage and runs `ffprobe` using safe subprocess execution.
   - Emits structured stage updates and persists verified metadata back to PostgreSQL.
5. **Future Python AI Service (Phase 6)**:
   - Dedicated service for heavy inference (`faster-whisper` and `Gemma 4`).
   - Completely separated from the lightweight Node.js worker.

```
+-------------------------------------------------------------------------+
|                        NEXT.JS APP ROUTER (Vercel)                      |
|                                                                         |
|  POST /api/videos/initiate ---> Direct Browser PUT ---> Cloudflare R2   |
|  POST /api/videos/[id]/complete                                         |
|    |                                                                    |
|    +--> DB Transaction: CookingVideo.uploadStatus = 'UPLOADED'          |
|         + ProcessingJob.status = 'PENDING_DISPATCH'                     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                          POSTGRESQL DATABASE                            |
|                                                                         |
|  Table: processing_jobs (Outbox)                                        |
|  - videoId, kitchenId, jobType, status, stage, attempts, metadata       |
|  - Partial Unique Index: only 1 active job per video & jobType          |
+-------------------------------------------------------------------------+
           ^                                                |
           | 1. Read PENDING_DISPATCH                       |
           | 3. Mark QUEUED                                 |
           v                                                v
+-------------------------------------------------------------------------+
|                  OUTBOX DISPATCHER (Node.js Worker)                     |
|                                                                         |
|  - Polls PENDING_DISPATCH records every 3000ms                          |
|  - Dispatches to BullMQ with deterministic ID: `video-val-${job.id}`    |
|  - Survives Redis downtime without losing pending jobs                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    REDIS / VALKEY (Render Key Value)                    |
|                                                                         |
|  - Queue: `video-validation`                                            |
|  - Queue: `ai-analysis` (Reserved for Phase 6)                          |
|  - maxmemory: 256MB, maxmemory-policy: noeviction                       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 BULLMQ CONSUMER WORKER (Node.js Worker)                 |
|                                                                         |
|  - Concurrency: 2 (configurable via WORKER_CONCURRENCY)                 |
|  - Download from storage -> safe temporary bounded file                 |
|  - FFprobe subprocess (timeout: 30s, maxBuffer: 5MB)                    |
|  - Extract duration, resolution, video/audio codecs, fps                |
|  - Update CookingVideo: validationStatus = VALIDATED                    |
|  - Update ProcessingJob: status = COMPLETED                             |
|  - Always unlinks temporary files in `finally` block                    |
+-------------------------------------------------------------------------+
```

---

## 2. Queue Definitions & Configuration

BullMQ queues are managed in `src/lib/queue/index.ts` with connection settings defined in `src/lib/queue/redis.ts`.

### Queue Names
- **`video-validation`**: Active in Phase 5. Processes technical container and stream inspection jobs via FFprobe.
- **`ai-analysis`**: Reserved for Phase 6. Dedicated to speech-to-text and multimodal cooking reasoning.

### Queue Retry & Retention Settings
- **Attempts**: 3 attempts with exponential backoff (`delay: 3000ms`, multiplying per attempt).
- **Completed Job Retention**: Retained for 24 hours (maximum 500 records) in Redis for auditability.
- **Failed Job Retention**: Retained for 7 days (maximum 1,000 records) in Redis for diagnostics.
- **Lock Duration & Stalling**: Lock duration set to 30,000ms; stalled interval set to 30,000ms (`maxStalledCount: 2`).

### Redis Client Connection Rules
- All worker connections configure `maxRetriesPerRequest: null`, as strictly required by BullMQ blocking commands.
- `lazyConnect: true` prevents unhandled process crashes on initial boot if Redis is starting up.

---

## 3. PostgreSQL Durable Job Model & State Machine

Redis queues hold in-flight job tokens, but PostgreSQL tracks permanent state, historical attempts, and audit logs.

### `ProcessingJob` Schema
- **`id`**: UUID primary key.
- **`videoId`**: Foreign key to `cooking_videos(id)` with cascading deletion.
- **`kitchenId`**: Foreign key to `kitchens(id)` with cascading deletion.
- **`jobType`**: `VIDEO_VALIDATION` | `AI_ANALYSIS`.
- **`status`**: `PENDING_DISPATCH` | `QUEUED` | `PROCESSING` | `COMPLETED` | `FAILED` | `CANCELLED`.
- **`stage`**: Human-readable sub-milestone (e.g., `WAITING_FOR_DISPATCH`, `QUEUED`, `DOWNLOADING`, `INSPECTING`, `VALIDATED`, `FAILED`).
- **`attempts`**: Number of times the job has been executed.
- **`maxAttempts`**: Maximum allowed retries (default: 3).
- **`errorCode`** & **`errorMessage`**: Sanitized failure details (all absolute file system paths stripped).
- **`progressInfo`**: JSON string containing verified metadata (`duration`, `videoCodec`, `audioCodec`, `width`, `height`, `fps`).
- **`queuedAt`**, **`startedAt`**, **`completedAt`**, **`lastHeartbeat`**: Timing metrics.

### Concurrency Protection & Partial Unique Index
To prevent duplicate concurrent validation jobs on the same video, a partial unique index is enforced in PostgreSQL:
```sql
CREATE UNIQUE INDEX "processing_jobs_active_video_job_idx" 
ON "processing_jobs"("videoId", "jobType") 
WHERE "status" IN ('PENDING_DISPATCH', 'QUEUED', 'PROCESSING');
```
Even if multiple requests race simultaneously, the database guarantees that exactly one active job can exist per video.

### Lifecycle Status Separation
Simmory enforces strict status separation so media validation is never confused with AI analysis:
1. **`VideoUploadStatus`**: `PENDING_UPLOAD` -> `UPLOADED` -> `FAILED` / `DELETED`.
2. **`MediaValidationStatus`**: `NOT_STARTED` -> `QUEUED` -> `VALIDATING` -> `VALIDATED` / `FAILED`.
3. **`VideoProcessingStatus` (AI)**: `NOT_STARTED` (Phase 6 will transition to `QUEUED` -> `PROCESSING` -> `COMPLETED`).

---

## 4. Transactional Outbox & Dispatch Guarantees

Directly pushing to Redis inside an HTTP request handler creates a dual-write failure mode: if the database commits but Redis is down, the background task is lost forever.

### The Outbox Strategy
1. **Upload Finalization**: When `POST /api/videos/[id]/complete` verifies the S3 object, it enters a PostgreSQL transaction:
   - Sets `CookingVideo.uploadStatus = 'UPLOADED'`.
   - Sets `CookingVideo.validationStatus = 'QUEUED'`.
   - Inserts `ProcessingJob` with `status = 'PENDING_DISPATCH'`.
2. **Asynchronous Dispatch**: The `OutboxDispatcher` periodically polls:
   - Queries `SELECT * FROM processing_jobs WHERE status = 'PENDING_DISPATCH' LIMIT 10`.
   - Dispatches each to BullMQ using deterministic ID `video-val-${job.id}`.
   - Upon successful Redis acknowledgment, updates `status = 'QUEUED'`, `queuedAt = now()`.
3. **Redis Downtime Resilience**: If Redis is offline, the dispatcher catches the error, logs a warning, and leaves the job in `PENDING_DISPATCH`. Once Redis returns, the dispatcher resumes without data loss.
4. **Idempotency**: Because BullMQ job IDs are deterministic (`video-val-${job.id}`), network re-transmissions cannot enqueue duplicate work in Redis.

---

## 5. Standalone Background Worker Lifecycle

The worker is implemented in `src/worker/index.ts` and runs independently of Next.js:

```bash
# Development (build & execute with live logs)
npm run worker:dev

# Production build
npm run worker:build

# Production execution
npm run worker:start
```

### Shutdown Handling
Upon receiving `SIGINT` or `SIGTERM`:
1. `OutboxDispatcher.stop()` halts the polling interval.
2. `Worker.close()` waits for active jobs to finish or cleanly pause.
3. BullMQ producer queues close.
4. Shared Redis connection disconnects.
5. PostgreSQL connection pools cleanly terminate via `db.$disconnect()`.

---

## 6. Technical Video Stream Validation via FFprobe

Video decodability inspection is performed in `src/worker/processors/video-validation.ts`.

### Security & Subprocess Safety
- Uses Node.js `execFile` with an explicit argument array, never `exec` with shell string concatenation.
- Temporary files are created in an OS-managed directory (`/tmp/simmory-validation/` with `0700` permissions) using cryptographic random suffixes (`vid-${jobId}-${randomBytes}.bin`).
- An unconditional `finally` block guarantees temporary file deletion on success, failure, and execution timeouts.
- File sizes are checked against `MAX_VIDEO_SIZE_MB` (default: 250 MB) before and after downloading.

### Inspection Rules
1. **At least 1 Video Stream**: Validates `codec_type === 'video'`. Containers lacking video streams are rejected with `NO_VIDEO_STREAM`.
2. **Valid Dimensions**: Width and height must be strictly positive integers.
3. **Decodable Duration**: Format duration must be a positive float.
4. **Audio Track Extraction**: Optional audio tracks are identified and their codec recorded (e.g. `aac`, `opus`).

---

## 7. Local Development Setup

### Starting Services via Docker Compose
A `docker-compose.yml` file is provided in the repository root:
```bash
docker compose up -d
```
This spins up:
- **PostgreSQL 16**: Port `127.0.0.1:5433` (Database: `simmory_dev`, User: `simmory`, Password: `simmory_dev_secret`).
- **Redis 7 Alpine**: Port `127.0.0.1:6379` configured with `--maxmemory 256mb --maxmemory-policy noeviction`.

### Running Application & Worker
Terminal 1:
```bash
npm run dev
```
Terminal 2:
```bash
npm run worker:dev
```

---

## 8. Render Deployment Configuration

The infrastructure blueprint is defined in `render.yaml`:
- **Render Key Value**: 256 MB starter instance, `noeviction` eviction policy, accessible exclusively over Render's private network.
- **Render Background Worker**: Starter instance (512 MB RAM, 0.5 CPU). Build command: `npm ci && npx prisma generate && npm run worker:build`. Start command: `npm run worker:start`.
- **Next.js Web Service**: Starter instance. Build command: `npm ci && npx prisma generate && npm run build`. Start command: `npm run start`.

### Memory Management on 512 MB Worker
- Concurrency default is set to `2` (`WORKER_CONCURRENCY="2"`).
- Large media files are streamed directly to disk, avoiding buffering entire multi-hundred megabyte videos in Node.js process heap memory.
- Heavy speech models (Whisper) and LLMs (Gemma 4) are explicitly prohibited from running inside this worker.

---

## 9. Future Python AI Service Integration (Phase 6)

Phase 6 will introduce AI-assisted recipe reconstruction:
- **Architecture**: A separate Python container (running FastAPI or Ray) will consume from the `ai-analysis` queue or receive jobs from the Node.js dispatcher.
- **Payload**: Contains only verified video IDs and storage keys (no raw binaries over message brokers).
- **Communication**: Authenticated internal HTTP or mutual Redis queue processing between Node.js and the Python inference cluster.

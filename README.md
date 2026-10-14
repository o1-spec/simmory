# Simmory

> **The way they made it, remembered.**

Simmory is a private family culinary archive designed to preserve traditional cooking knowledge that is rarely written down—the intuitive pinches, sensory cues, spoken stories, cultural context, and unscripted moments of family cooking demonstrations.

---

## 1. Project Introduction

Much of the world's most cherished culinary wisdom lives only in the muscle memory and instincts of our parents and grandparents. Traditional recipes are rarely expressed in metric grams or standardized teaspoons:
- *"Add water until the dough feels like an earlobe."*
- *"Listen for the sizzle to soften before turning the flame."*
- *"Cook until the oil separates and the aroma fills the hallway."*

When families record cooking demonstrations on mobile phones, the resulting video files often get buried in photo rolls or lost on hard drives. Standard recipe applications force these fluid practices into rigid measurement cards, stripping out the storytelling and tactile knowledge that made the dishes special.

**Simmory** bridges this divide. It combines private family kitchens, direct video upload, evidence-grounded AI analysis, human verification, and an interactive Cook Along mode that links every instruction to real moments in the original video.

---

## 2. Why Simmory?

### The Core Philosophy

> **AI proposes. Humans clarify. Evidence supports. Families preserve.**

Generic AI video summarizers and transcription tools frequently hallucinate ingredients, standardize intuitive measurements into arbitrary units, or fabricate dialogue during silent cooking footage.

Simmory takes the opposite approach:
1. **Uncertainty is preserved**: If a measurement is ambiguous or an action occurs off-camera, the AI flags it as a question for the family rather than inventing an answer.
2. **Every step is grounded in evidence**: Every proposed step links directly to exact video timestamps, audio transcripts, or sampled video frames.
3. **Humans hold editorial authority**: AI proposals are strictly provisional until reviewed, adjusted, and approved by family members.
4. **Original cook verification**: Preserves the distinction between an unreviewed machine proposal, a family-reviewed recipe, and one verified by the original cook.

---

## 3. Features

- **Private Family Kitchens**: Isolated spaces for extended families to gather recipes, videos, and memories with role-based access control (Owner, Editor, Viewer).
- **Handwritten Recipe & Memory Preservation**: Heirloom-styled recipe cards capturing stories, cultural origins, heirloom notes, and sensory cues.
- **Direct Video Upload & Storage**: Secure browser-to-object-storage upload supporting Cloudflare R2 and AWS S3-compatible endpoints.
- **FFprobe Media Validation**: Automated validation verifying container format, stream codecs (H.264, H.265, VP8, VP9, AV1), duration limits, and corruption prevention.
- **Local AI Transcription & Visual Analysis**:
  - Speech transcription powered by **Faster-Whisper** with audio silence detection to prevent hallucinations.
  - Video frame extraction and vision reasoning powered by **Gemma 4** through local **Ollama** inference.
- **Evidence-Linked Timeline Reconstruction**: Generates proposed cooking steps mapped to precise video timestamps and keyframe evidence.
- **Human-in-the-Loop Recipe Review**:
  - Non-modal, focused editorial workspace to accept, edit, or reject proposed cooking events.
  - Interactive clarification cards to capture family knowledge for ambiguous measurements.
  - Dynamic ingredient normalization.
  - One-click recipe conversion preserving all grounded evidence.
- **Interactive Cook Along Experience**:
  - Resilient, step-by-step guidance designed for real kitchen use.
  - Synchronized video clip playback corresponding to the active step.
  - Mise en place ingredient checklists with persistence.
  - Contextual cooking countdown timers with duration extraction.
  - Distraction-free full-screen cooking focus mode.
  - Cross-device cooking session progress tracking.

---

## 4. How Simmory Works

```mermaid
flowchart TD
    subgraph Upload ["1. Capture & Upload"]
        A[Original Video] -->|Presigned Direct Upload| B[(Object Storage R2/S3)]
        B -->|Transactional Outbox| C[BullMQ Queue]
    end

    subgraph Process ["2. Validation & AI Analysis"]
        C --> D[Background Worker]
        D -->|FFprobe| E{Media Valid?}
        E -->|Yes| F[Python AI Service]
        F -->|Faster-Whisper| G[Speech & Audio Cues]
        F -->|Gemma 4 via Ollama| H[Visual Action Analysis]
        G & H --> I[Evidence-Linked Proposal]
    end

    subgraph Review ["3. Human Verification"]
        I --> J[Human Review Workspace]
        J -->|Clarify Pinches & Timing| K[Family Member Decision]
        K -->|Save as Recipe| L[(PostgreSQL Heirloom Recipe)]
    end

    subgraph Cook ["4. Interactive Cooking"]
        L --> M[Cook Along Experience]
        M -->|Synced Video Clips| N[Step Navigation & Timers]
    end
```

1. **Upload**: An authorized family member uploads cooking footage directly to private object storage via presigned URLs.
2. **Validate**: A background worker downloads the media, validates container integrity, and verifies stream metadata via FFprobe.
3. **Analyze**: The Python AI service samples video frames and transcribes audio locally using Faster-Whisper and Gemma 4 via Ollama, reconstructing a provisional cooking timeline.
4. **Review**: Family members review the timeline, answer ambiguity questions, adjust ingredient quantities, and convert the evidence into an heirloom recipe.
5. **Cook Along**: Anyone in the family cooks the dish with synchronized video snippets, ingredient checklists, and step timers.

---

## 5. Interface & User Experience

Simmory features an editorial aesthetic inspired by culinary heritage notebooks:
- **Calm, Dialog-Free Interaction**: All modals and popups have been eliminated in favor of clean, inline sections and dedicated application pages (`/kitchens/new`, `/kitchens/[id]/settings`).
- **Destructive Action Safety**: Inline confirmation panels for deleting kitchens, recipes, and videos with explicit typed confirmations.
- **Responsive Navigation**: Full support for desktop viewports, tablets, and mobile kitchen counters.

> *Note: Visual screenshots will be captured directly from live demonstrations and archived under `docs/screenshots/`.*

---

## 6. Technology Stack

### Web Application & Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 5 (Strict Mode)
- **Icons**: Lucide React

### Backend, Database & Worker
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Authentication**: Stateless JWT via `jose` with Argon2id password hashing and secure HttpOnly cookies
- **Background Jobs**: BullMQ with Redis / Valkey
- **Media Validation**: Node.js child process with `ffprobe`
- **Storage**: AWS S3 SDK v3 (Cloudflare R2 compatible)

### AI Processing Service
- **Runtime**: Python 3.12+ / 3.13
- **API Framework**: FastAPI & Uvicorn
- **Speech-to-Text**: Faster-Whisper
- **Vision Reasoning**: Gemma 4 via Ollama
- **Frame Extraction**: FFmpeg

### Automated Quality & Testing
- **Unit & Integration Tests**: Vitest (117 tests passing)
- **Python Service Tests**: Pytest (17 tests passing)
- **Code Quality**: ESLint 9 with strict `no-console` policy

---

## 7. Architecture

The codebase is structured into isolated, purpose-built components:

```
simmory-web/
├── src/
│   ├── app/                 # Next.js 16 App Router pages and API route handlers
│   ├── components/          # Reusable UI, cook-along, and review components
│   ├── lib/                 # Core domain services, auth, DB, storage, and queue
│   │   ├── auth/            # Session, JWT, password, and permission helpers
│   │   ├── services/        # Recipes, kitchens, videos, jobs, and review logic
│   │   ├── storage/         # Cloudflare R2 / S3 storage abstraction
│   │   ├── queue/           # BullMQ queue definitions and Redis connection
│   │   └── logger.ts        # Structured server logging with sensitive data redaction
│   └── worker/              # Standalone Node.js background worker & outbox dispatcher
├── services/
│   └── ai/                  # Independent Python FastAPI AI processing service
│       ├── app/             # Audio, vision, and timeline reconstruction pipelines
│       └── tests/           # Pytest test suite
├── prisma/                  # Prisma schema, migrations, and seeds
├── docs/                    # Deep-dive architecture and technical specifications
└── tests/                   # Vitest unit and integration test suite
```

For complete architectural details, see [docs/architecture.md](docs/architecture.md).

---

## 8. Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js**: v20.x or higher
- **Python**: v3.11, v3.12, or v3.13
- **Docker**: For running PostgreSQL and Redis
- **FFmpeg & FFprobe**: Required for media validation and frame extraction
  ```bash
  # macOS (Homebrew)
  brew install ffmpeg

  # Ubuntu/Debian
  sudo apt-get update && sudo apt-get install -y ffmpeg
  ```
- **Ollama**: For local AI model inference
  ```bash
  ollama pull gemma4
  ```

---

### Step 1: Clone and Install Web Dependencies

```bash
git clone https://github.com/your-username/simmory-web.git
cd simmory-web
npm install
```

---

### Step 2: Set Up Local Services via Docker

Start local PostgreSQL and Redis instances:

```bash
docker-compose up -d
```

---

### Step 3: Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Review the values in `.env`. The defaults are pre-configured for local Docker development:
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/simmory_dev"`
- `REDIS_URL="redis://127.0.0.1:6379"`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

> **Note**: External cloud object storage credentials (Cloudflare R2) are **not required** to build, test, or run local development.

---

### Step 4: Run Database Migrations

Apply database migrations and generate the Prisma Client:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

---

### Step 5: Set Up Python AI Processing Service

```bash
cd services/ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

---

### Step 6: Start All Services

Open three terminal tabs to run the components:

**Terminal 1 — Web Application (Next.js):**
```bash
npm run dev
```
Accessible at [http://localhost:3000](http://localhost:3000).

**Terminal 2 — Background Worker & Outbox Dispatcher:**
```bash
npm run worker:dev
```

**Terminal 3 — Python AI Service:**
```bash
cd services/ai
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 9. Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://...:5433/simmory_dev` |
| `REDIS_URL` | Redis / Valkey connection string | Yes | `redis://127.0.0.1:6379` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | Yes | Auto-configured in dev |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Yes | Auto-configured in dev |
| `AI_SERVICE_URL` | Loopback URL for Python AI Service | Yes | `http://127.0.0.1:8000` |
| `AI_SERVICE_SECRET` | Shared secret for internal AI API auth | Yes | Auto-configured in dev |
| `R2_ACCOUNT_ID` | Cloudflare account ID | Optional | Cloud storage only |
| `R2_ACCESS_KEY_ID` | S3/R2 access key ID | Optional | Cloud storage only |
| `R2_SECRET_ACCESS_KEY` | S3/R2 secret access key | Optional | Cloud storage only |
| `R2_BUCKET_NAME` | S3/R2 bucket name | Optional | Cloud storage only |

---

## 10. Running Tests & Quality Verification

Run the comprehensive test suites to ensure full system health:

```bash
# Run Vitest test suite (117 tests covering auth, recipes, jobs, videos, and cook-along)
npm test

# Run Python AI service tests (17 tests covering audio, vision, and timeline schemas)
PYTHONPATH=. services/ai/.venv/bin/pytest services/ai/tests

# Check ESLint quality (strictly enforces no-console policy)
npm run lint

# Check TypeScript type safety (zero errors required)
npx tsc --noEmit

# Test production build for Next.js
npm run build

# Test production bundle for background worker
npm run worker:build
```

---

## 11. Security and Privacy

- **Private by Default**: All videos, recipes, and kitchens are private. No public indexing or unauthenticated access.
- **Strict Role Boundaries**: Kitchen roles (`OWNER`, `EDITOR`, `VIEWER`) are enforced server-side on every query and mutation to prevent IDOR vulnerabilities.
- **Stateless, Tamper-Proof Sessions**: Authentication relies on signed JWTs stored in secure `HttpOnly`, `SameSite=Lax` cookies with server-side refresh rotation and token revocation.
- **Private Media Playback**: Object storage prevents public bucket access; playback occurs through time-limited, signed URLs with non-cacheable responses.
- **Sensitive Data Redaction**: The custom logging framework (`src/lib/logger.ts`) automatically redacts passwords, tokens, API keys, and private transcripts from log output.

---

## 12. Known Limitations & Technical Constraints

- **Local AI Compute**: Full visual analysis requires adequate CPU/GPU resources when running local Ollama inference.
- **Cloud Storage Prerequisite**: Direct video uploads and presigned playback require Cloudflare R2 or S3 credentials in staging/production. The app cleanly reports service status when storage is unconfigured.
- **Audio Clarity**: Whisper speech recognition depends on acoustic clarity; background kitchen noises (exhaust fans, sizzling pans) are identified via audio silence detection and marked as unvoiced.

---

## 13. Contributing

Contributions that align with Simmory's focus on privacy, evidence-grounded AI, and accessibility are welcome.

### How to Contribute

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow established patterns:
   - Use Server Components where possible; keep client state local.
   - Do not introduce browser pop-ups, alerts, or floating modals; use inline patterns.
   - Do not add debugging `console.log` statements; use `src/lib/logger.ts`.
3. Verify that all tests and lint checks pass:
   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
4. Submit a clear, well-described Pull Request.

---

## 14. License

This project does not currently have a declared open-source license. All rights are reserved by the repository maintainer until a license is formally selected.

---

*Simmory — Preserving family cooking heritage, one meal at a time.*

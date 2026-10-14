import asyncio
import logging
import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
import httpx
from pydantic import BaseModel
from .config import settings
from .pipeline import run_ai_pipeline
from .schemas import AIAnalysisResponse, HealthResponse
from .utils.cleanup import temporary_workspace
from .utils.security import verify_internal_key

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("simmory-ai")

app = FastAPI(
    title="Simmory AI Video Analysis & Recipe Reconstruction Service",
    description="Stand-alone local AI inference service for video-linked cooking knowledge preservation",
    version="1.0.0"
)

# Global semaphore to enforce bounded local inference concurrency
inference_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_JOBS)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Lightweight health check endpoint.
    Verifies service connectivity and checks whether Ollama is reachable without failing startup.
    """
    ollama_ok = False
    model_present = False

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                ollama_ok = True
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                model_present = any(
                    settings.OLLAMA_MODEL in m or m.startswith(settings.OLLAMA_MODEL)
                    for m in models
                )
    except Exception:
        ollama_ok = False
        model_present = False

    return HealthResponse(
        status="ok",
        whisper_available=True,
        ollama_available=ollama_ok,
        ollama_model_present=model_present,
        version="1.0.0"
    )


class AnalyzePathRequest(BaseModel):
    video_path: str


@app.post("/api/analyze/path", response_model=AIAnalysisResponse)
async def analyze_video_by_path(
    req: AnalyzePathRequest,
    _key: str = Depends(verify_internal_key)
):
    """
    Analyzes a video file residing on the local filesystem.
    Requires internal authentication key.
    """
    path = Path(req.video_path).resolve()
    if not path.exists() or not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video file not found at path: {req.video_path}"
        )

    # Acquire concurrency lock
    try:
        async with inference_semaphore:
            logger.info(f"[API] Starting pipeline on path: {path}")
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, run_ai_pipeline, path, None)
            return result
    except Exception as err:
        logger.error(f"[API] Pipeline execution failed: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI pipeline analysis failed: {str(err)}"
        )


@app.post("/api/analyze", response_model=AIAnalysisResponse)
async def analyze_video_stream(
    file: UploadFile = File(...),
    _key: str = Depends(verify_internal_key)
):
    """
    Accepts video media streamed from the Node.js background worker,
    saves it safely to a temporary file, and runs the reconstruction pipeline.
    """
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    import uuid
    temp_video_path = settings.TEMP_DIR / f"upload_{uuid.uuid4().hex}_{file.filename or 'video.mp4'}"

    try:
        # Bounded streaming write to disk
        with open(temp_video_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024 * 2):  # 2MB chunks
                buffer.write(chunk)

        # Acquire concurrency lock and execute pipeline
        async with inference_semaphore:
            logger.info(f"[API] Running pipeline on streamed video ({temp_video_path.stat().st_size} bytes)")
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, run_ai_pipeline, temp_video_path, None)
            return result

    except Exception as err:
        logger.error(f"[API] Streamed pipeline failed: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI pipeline analysis failed: {str(err)}"
        )
    finally:
        # Clean up temporary uploaded video file
        if temp_video_path.exists():
            try:
                temp_video_path.unlink()
            except Exception:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "services.ai.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )

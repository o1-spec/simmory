import os
from pathlib import Path


class Settings:
    # Service Network Configuration
    HOST: str = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
    INTERNAL_API_KEY: str = os.getenv(
        "SIMMORY_AI_INTERNAL_KEY",
        "simmory_dev_internal_ai_secret_key_2026_change_in_prod"
    )

    # Faster-Whisper Configuration
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "small")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

    # Ollama Vision & Reasoning Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma4:e4b-it-qat")
    OLLAMA_REQUEST_TIMEOUT: float = float(os.getenv("OLLAMA_REQUEST_TIMEOUT", "180.0"))

    # Processing & Resource Limits
    FRAME_SAMPLING_INTERVAL_SECONDS: float = float(
        os.getenv("FRAME_SAMPLING_INTERVAL_SECONDS", "10.0")
    )
    MAX_FRAMES_PER_VIDEO: int = int(os.getenv("MAX_FRAMES_PER_VIDEO", "30"))
    MAX_VIDEO_DURATION_SECONDS: float = float(
        os.getenv("MAX_VIDEO_DURATION_SECONDS", "3600.0")
    )
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "1"))

    # File System & Temporary Workspace
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    TEMP_DIR: Path = Path(os.getenv("AI_TEMP_DIR", str(BASE_DIR / "tmp")))


settings = Settings()

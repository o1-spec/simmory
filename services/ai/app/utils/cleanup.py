import shutil
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from ..config import settings


@contextmanager
def temporary_workspace(prefix: str = "job_") -> Generator[Path, None, None]:
    """
    Context manager that creates a unique temporary working directory
    for audio/frame extraction and guarantees cleanup even if processing fails.
    """
    import uuid
    work_dir = settings.TEMP_DIR / f"{prefix}{uuid.uuid4().hex}"
    work_dir.mkdir(parents=True, exist_ok=True)
    try:
        yield work_dir
    finally:
        if work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)

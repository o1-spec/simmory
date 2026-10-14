import hmac
import subprocess
from typing import List, Optional
from fastapi import HTTPException, Header, Security, status
from ..config import settings


def verify_internal_key(
    x_simmory_internal_key: Optional[str] = Header(None, alias="X-Simmory-Internal-Key")
) -> str:
    """
    Validates internal authentication header to ensure only local authorized services
    (such as the Simmory Node.js worker) can trigger inference.
    """
    if not x_simmory_internal_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required internal authentication header: X-Simmory-Internal-Key"
        )

    expected = settings.INTERNAL_API_KEY.encode("utf-8")
    provided = x_simmory_internal_key.encode("utf-8")

    if not hmac.compare_digest(expected, provided):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal authentication key"
        )

    return x_simmory_internal_key


def safe_run_subprocess(
    cmd: List[str],
    timeout_seconds: float = 60.0
) -> subprocess.CompletedProcess:
    """
    Executes a subprocess safely using array args (never shell=True).
    Enforces explicit execution timeout.
    """
    try:
        return subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_seconds,
            check=False
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(f"Subprocess timed out after {timeout_seconds}s: {' '.join(cmd)}") from e

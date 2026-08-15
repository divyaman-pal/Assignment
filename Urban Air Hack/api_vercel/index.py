"""Vercel serverless entrypoint for the VAYU-NET API.

Vercel's Python runtime serves any ASGI application exported as `app` from
a file under /api. This module simply re-exports the FastAPI application so
that the identical codebase runs locally (uvicorn) and on Vercel.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.main import app  # noqa: E402  (ASGI app discovered by the runtime)

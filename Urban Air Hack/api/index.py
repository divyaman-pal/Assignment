"""Vercel serverless entrypoint.

Vercel builds each file under /api into a serverless function, so the FastAPI
application itself lives in /service and is re-exported here as the single
function that serves every route.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from service.live_api import app  # noqa: E402,F401  (ASGI app discovered by the runtime)

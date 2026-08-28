"""Load .env for local runs.

CI and Vercel inject the same names as real environment variables, and
`setdefault` never overwrites those — so importing this is a no-op there and
the deployed system keeps working with no .env file present.

Scripts that read an API key at module top level must import this before that
read, otherwise the key looks unset locally even though .env has it.
"""
import os
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def load(path=ENV_FILE):
    if not Path(path).exists():
        return False
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())
    return True


load()

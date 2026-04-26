from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ExternalAPIError(Exception):
    status_code: int
    detail: str
    payload: dict[str, Any] | list[Any] | str | None = None


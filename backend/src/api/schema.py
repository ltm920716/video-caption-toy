from typing import List, Optional
from pydantic import BaseModel
from enum import Enum


class Mode(str, Enum):
    static = "static"
    dynamic = "dynamic"


class SubtitleErase(BaseModel):
    file_path: str
    mode: Optional[Mode] = Mode.static
    regions: List[list]


class GetStatus(BaseModel):
    user_id: str
    task_id: str
# schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any

class QueryRequest(BaseModel):
    question: str
    k: int = 6

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []

class DocumentUpload(BaseModel):
    filename: str
    content: str
    metadata: Dict[str, Any] = {}
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI

router = APIRouter(tags=["ai"])


class AIRequest(BaseModel):
    input: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    aiCredits: float = Field(..., ge=0)
    costEstimate: float = Field(default=1.0, gt=0)
    model: str = Field(default="gpt-5.2", min_length=1)


class AIResponse(BaseModel):
    output_text: str
    remaining_ai_credits: float
    user_id: str


@router.post("/api/ai", response_model=AIResponse)
def call_ai(request: AIRequest):
    if request.aiCredits <= 0:
        raise HTTPException(status_code=402, detail="Recharge your AI Battery")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server")

    client = OpenAI(api_key=api_key)
    response = client.responses.create(model=request.model, input=request.input)

    remaining_credits = max(0.0, request.aiCredits - request.costEstimate)

    return AIResponse(
        output_text=response.output_text,
        remaining_ai_credits=remaining_credits,
        user_id=request.user_id,
    )

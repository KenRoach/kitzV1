import os
from dataclasses import dataclass
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI

router = APIRouter(tags=["ai"])


@dataclass
class UserBattery:
    ai_credits: float


# v0.1 in-memory store (replace with DB later)
USER_BATTERY_STORE = {
    "demo-user": UserBattery(ai_credits=10.0),
}


class AIRequest(BaseModel):
    input: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    model: str = Field(default="gpt-5.2", min_length=1)


class AIResponse(BaseModel):
    output_text: str
    remaining_ai_credits: float
    user_id: str


def deduct_credits(user_id: str, usage_cost: float) -> float:
    user_battery = USER_BATTERY_STORE[user_id]
    user_battery.ai_credits = max(0.0, user_battery.ai_credits - usage_cost)
    return user_battery.ai_credits


@router.post("/api/ai", response_model=AIResponse)
def call_ai(request: AIRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server")

    user_battery = USER_BATTERY_STORE.get(request.user_id)
    if not user_battery:
        raise HTTPException(status_code=404, detail="User not found")

    if user_battery.ai_credits <= 0:
        raise HTTPException(status_code=402, detail="Recharge your AI Battery")

    client = OpenAI(api_key=api_key)
    response = client.responses.create(model=request.model, input=request.input)

    # v0.1 fixed usage debit per call; swap to token-based cost when usage metadata is wired
    remaining_credits = deduct_credits(request.user_id, usage_cost=1.0)

    return AIResponse(
        output_text=response.output_text,
        remaining_ai_credits=remaining_credits,
        user_id=request.user_id,
    )

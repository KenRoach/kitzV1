import ai_api
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


class _FakeResponses:
    @staticmethod
    def create(model, input):
        class _Resp:
            output_text = f"mocked:{model}:{input}"

        return _Resp()


class _FakeOpenAI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.responses = _FakeResponses()


def test_ai_battery_blocks_request(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    ai_api.USER_BATTERY_STORE["u-1"] = ai_api.UserBattery(ai_credits=0)

    payload = {
        "input": "Say hi in one sentence.",
        "user_id": "u-1",
    }
    response = client.post("/api/ai", json=payload)

    assert response.status_code == 402
    assert response.json()["detail"] == "Recharge your AI Battery"


def test_api_key_required(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    ai_api.USER_BATTERY_STORE["u-1"] = ai_api.UserBattery(ai_credits=3)

    payload = {
        "input": "Say hi in one sentence.",
        "user_id": "u-1",
    }
    response = client.post("/api/ai", json=payload)

    assert response.status_code == 500
    assert "OPENAI_API_KEY" in response.json()["detail"]


def test_user_not_found(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    payload = {
        "input": "Say hi in one sentence.",
        "user_id": "missing-user",
    }
    response = client.post("/api/ai", json=payload)

    assert response.status_code == 404


def test_ai_endpoint_success(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(ai_api, "OpenAI", _FakeOpenAI)
    ai_api.USER_BATTERY_STORE["u-1"] = ai_api.UserBattery(ai_credits=3)

    payload = {
        "input": "Say hi in one sentence.",
        "user_id": "u-1",
        "model": "gpt-5.2",
    }
    response = client.post("/api/ai", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["output_text"] == "mocked:gpt-5.2:Say hi in one sentence."
    assert body["remaining_ai_credits"] == 2.0
    assert body["user_id"] == "u-1"

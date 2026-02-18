from fastapi.testclient import TestClient

from main import app
from tool_gateway import store


client = TestClient(app)


def base_payload(request_id: str, requested_action: str):
    return {
        "agent_name": "openclaw-agent",
        "reason": "process request",
        "business_context": "tenant operations",
        "requested_action": requested_action,
        "ai_battery_estimate": 1.5,
        "tenant_id": "tenant-1",
        "user_id": "user-1",
        "request_id": request_id,
        "payload": {"value": "x"},
    }


def setup_function():
    store.audit_events.clear()
    store.leads.clear()
    store.interactions.clear()
    store.quotes.clear()
    store.orders.clear()
    store.invoices.clear()
    store.ai_charges.clear()
    store.idempotent_results.clear()


def test_missing_required_fields_rejected_and_audited():
    response = client.post("/tools/crm/create_lead", json={"agent_name": "missing"})
    assert response.status_code == 422
    assert store.audit_events
    assert store.audit_events[-1]["status"] == "failure"


def test_approval_gate_required_for_invoice_creation():
    payload = base_payload("req-invoice-1", "create_invoice")
    response = client.post("/tools/finance/create_invoice", json=payload)
    assert response.status_code == 403

    payload["human_approval_id"] = "ha-123"
    ok_response = client.post("/tools/finance/create_invoice", json=payload)
    assert ok_response.status_code == 200
    assert ok_response.json()["ok"] is True


def test_approval_gate_required_for_ai_battery_charge():
    payload = base_payload("req-charge-1", "charge_ai_battery")
    response = client.post("/tools/ai-battery/charge", json=payload)
    assert response.status_code == 403

    payload["approval_token"] = "token-abc"
    ok_response = client.post("/tools/ai-battery/charge", json=payload)
    assert ok_response.status_code == 200


def test_idempotency_replays_result():
    payload = base_payload("req-order-1", "create_order")
    first = client.post("/tools/orders/create_order", json=payload)
    second = client.post("/tools/orders/create_order", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["idempotent"] is True


def test_all_defined_tool_endpoints_exist():
    payload = base_payload("req-crm-1", "create_lead")
    routes = [
        "/tools/crm/create_lead",
        "/tools/crm/update_lead",
        "/tools/crm/log_interaction",
        "/tools/orders/create_quote",
        "/tools/orders/create_order",
        "/tools/orders/update_status",
        "/tools/finance/get_kpis",
        "/tools/finance/create_invoice",
        "/tools/ai-battery/estimate",
        "/tools/ai-battery/charge",
        "/tools/audit/log",
    ]

    for idx, route in enumerate(routes):
        body = base_payload(f"req-{idx}", payload["requested_action"])
        if route in {"/tools/finance/create_invoice", "/tools/ai-battery/charge"}:
            body["human_approval_id"] = f"approval-{idx}"
        response = client.post(route, json=body)
        assert response.status_code in {200, 403, 422}

    assert len(store.audit_events) >= len(routes)

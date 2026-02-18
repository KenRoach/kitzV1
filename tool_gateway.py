from datetime import datetime
from threading import Lock
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator


router = APIRouter(prefix="/tools", tags=["Tool Gateway"])


class InMemoryGatewayStore:
    """In-memory persistence for v0.1; replace with DB repository later."""

    def __init__(self) -> None:
        self._lock = Lock()
        self.audit_events: List[Dict[str, Any]] = []
        self.leads: Dict[str, Dict[str, Any]] = {}
        self.interactions: List[Dict[str, Any]] = []
        self.quotes: Dict[str, Dict[str, Any]] = {}
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.invoices: Dict[str, Dict[str, Any]] = {}
        self.ai_charges: Dict[str, Dict[str, Any]] = {}
        self.idempotent_results: Dict[str, Dict[str, Any]] = {}

    def save_idempotent(self, request_id: str, result: Dict[str, Any]) -> None:
        with self._lock:
            self.idempotent_results[request_id] = result

    def get_idempotent(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self.idempotent_results.get(request_id)

    def add_audit_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self.audit_events.append(event)
        return event


store = InMemoryGatewayStore()


class ToolRequestBase(BaseModel):
    agent_name: str
    reason: str
    business_context: str
    requested_action: str
    ai_battery_estimate: float = Field(ge=0)
    tenant_id: str
    user_id: Optional[str] = None
    account_id: Optional[str] = None
    request_id: str
    approval_token: Optional[str] = None
    human_approval_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def user_or_account_required(self) -> "ToolRequestBase":
        if not self.user_id and not self.account_id:
            raise ValueError("Either user_id or account_id is required")
        return self


class AuditLogRequest(ToolRequestBase):
    status: str = "manual"
    error_message: Optional[str] = None


SENSITIVE_ACTION_KEYWORDS = (
    "refund",
    "delete",
    "permission",
)


def approval_present(request: ToolRequestBase) -> bool:
    return bool(request.approval_token or request.human_approval_id)


def requires_approval_for_action(action: str) -> bool:
    action_lower = action.lower()
    return any(keyword in action_lower for keyword in SENSITIVE_ACTION_KEYWORDS)


def log_event(request: ToolRequestBase, endpoint: str, status: str, detail: Dict[str, Any], error_message: Optional[str] = None) -> None:
    store.add_audit_event(
        {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": endpoint,
            "status": status,
            "error_message": error_message,
            "request": request.model_dump(exclude={"approval_token"}),
            "detail": detail,
        }
    )


def process_tool_action(
    request: ToolRequestBase,
    endpoint: str,
    collection: Dict[str, Dict[str, Any]],
    *,
    write_allowed: bool,
    approval_required: bool = False,
) -> Dict[str, Any]:
    existing = store.get_idempotent(request.request_id)
    if existing:
        log_event(request, endpoint, "idempotent_replay", existing)
        return {"idempotent": True, **existing}

    if not write_allowed:
        message = "Endpoint is read-only by default and does not allow write operations"
        log_event(request, endpoint, "failure", {"message": message}, message)
        raise HTTPException(status_code=403, detail=message)

    needs_approval = approval_required or requires_approval_for_action(request.requested_action)
    if needs_approval and not approval_present(request):
        message = "This action requires approval_token or human_approval_id"
        log_event(request, endpoint, "failure", {"message": message}, message)
        raise HTTPException(status_code=403, detail=message)

    record = {
        "request_id": request.request_id,
        "tenant_id": request.tenant_id,
        "requested_action": request.requested_action,
        "payload": request.payload,
        "created_by": request.user_id or request.account_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    collection[request.request_id] = record
    result = {"ok": True, "endpoint": endpoint, "record": record}
    store.save_idempotent(request.request_id, result)
    log_event(request, endpoint, "success", result)
    return result


@router.post("/crm/create_lead")
def create_lead(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(request, "crm/create_lead", store.leads, write_allowed=True)


@router.post("/crm/update_lead")
def update_lead(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(request, "crm/update_lead", store.leads, write_allowed=True)


@router.post("/crm/log_interaction")
def log_interaction(request: ToolRequestBase) -> Dict[str, Any]:
    response = process_tool_action(
        request,
        "crm/log_interaction",
        {"interactions": {"request_id": request.request_id}},
        write_allowed=True,
    )
    store.interactions.append(response["record"])
    return response


@router.post("/orders/create_quote")
def create_quote(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(request, "orders/create_quote", store.quotes, write_allowed=True)


@router.post("/orders/create_order")
def create_order(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(request, "orders/create_order", store.orders, write_allowed=True)


@router.post("/orders/update_status")
def update_order_status(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(request, "orders/update_status", store.orders, write_allowed=True)


@router.post("/finance/get_kpis")
def get_finance_kpis(request: ToolRequestBase) -> Dict[str, Any]:
    existing = store.get_idempotent(request.request_id)
    if existing:
        log_event(request, "finance/get_kpis", "idempotent_replay", existing)
        return {"idempotent": True, **existing}

    result = {
        "ok": True,
        "endpoint": "finance/get_kpis",
        "record": {
            "request_id": request.request_id,
            "tenant_id": request.tenant_id,
            "kpis": {"revenue": 0.0, "orders": 0, "avg_ticket": 0.0},
        },
    }
    store.save_idempotent(request.request_id, result)
    log_event(request, "finance/get_kpis", "success", result)
    return result


@router.post("/finance/create_invoice")
def create_invoice(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(
        request,
        "finance/create_invoice",
        store.invoices,
        write_allowed=True,
        approval_required=True,
    )


@router.post("/ai-battery/estimate")
def estimate_ai_battery(request: ToolRequestBase) -> Dict[str, Any]:
    existing = store.get_idempotent(request.request_id)
    if existing:
        log_event(request, "ai-battery/estimate", "idempotent_replay", existing)
        return {"idempotent": True, **existing}

    result = {
        "ok": True,
        "endpoint": "ai-battery/estimate",
        "record": {
            "request_id": request.request_id,
            "tenant_id": request.tenant_id,
            "estimated_units": request.ai_battery_estimate,
        },
    }
    store.save_idempotent(request.request_id, result)
    log_event(request, "ai-battery/estimate", "success", result)
    return result


@router.post("/ai-battery/charge")
def charge_ai_battery(request: ToolRequestBase) -> Dict[str, Any]:
    return process_tool_action(
        request,
        "ai-battery/charge",
        store.ai_charges,
        write_allowed=True,
        approval_required=True,
    )


@router.post("/audit/log")
def audit_log(request: AuditLogRequest) -> Dict[str, Any]:
    event = store.add_audit_event(
        {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": "audit/log",
            "status": request.status,
            "error_message": request.error_message,
            "request": request.model_dump(exclude={"approval_token"}),
            "detail": request.payload,
        }
    )
    return {"ok": True, "event": event}


@router.get("/audit/events")
def list_audit_events() -> Dict[str, Any]:
    return {"count": len(store.audit_events), "events": store.audit_events}

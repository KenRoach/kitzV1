# Order-Manager-POS
# Sistema POS para Gestión de Órdenes

![Integraciones](https://img.shields.io/badge/Integraciones-WhatsApp%20%7C%20Sitio_Web-success)

Sistema punto de venta especializado en gestión de órdenes para cocina, con integración a WhatsApp y sitio web.

## Características Principales
- 🖥️ Interfaz web para gestión de órdenes
- 📱 Notificaciones automáticas a WhatsApp (En Construccion)
- 📊 Panel de visualización de órdenes en tiempo real (En Construccion)
- 🗃️ Gestión de categorías y productos (En Construccion)
- 📈 Reportes de ventas básicos [Mealkitz](https://c093-34-133-184-63.ngrok-free.app/dashboard/34)
- 🔄 Integración con sitios web externos (En Construccion)

## Requisitos
- Python 3.8+
- PostgreSQL (opcional)
- Cuenta de desarrollador de WhatsApp API

## Instalación
1. Clonar repositorio:
```bash
git clone [https://github.com/Mealkitz-Dev/Order-Manager-POS]
cd nombre-del-repositorio

## Kitz Tool Gateway (v0.1)

This repository now includes a **Tool Access Gateway** for agent calls under `/tools/*`.

### Supported tool routes
- `POST /tools/crm/create_lead`
- `POST /tools/crm/update_lead`
- `POST /tools/crm/log_interaction`
- `POST /tools/orders/create_quote`
- `POST /tools/orders/create_order`
- `POST /tools/orders/update_status`
- `POST /tools/finance/get_kpis`
- `POST /tools/finance/create_invoice` (**approval required**)
- `POST /tools/ai-battery/estimate`
- `POST /tools/ai-battery/charge` (**approval required**)
- `POST /tools/audit/log`

### Required request contract (all routes)
OpenClaw must send these fields on every request:
- `agent_name`
- `reason`
- `business_context`
- `requested_action`
- `ai_battery_estimate`
- `tenant_id`
- `request_id`
- `user_id` **or** `account_id`

Optional approval fields:
- `approval_token`
- `human_approval_id`

### Approval gate rules
The gateway enforces approval tokens/ids for:
- Invoice creation
- AI battery charging
- Any action whose `requested_action` contains `refund`, `delete`, or `permission`

### Idempotency
`request_id` is treated as an idempotency key. Replayed calls return the stored result.

### Auditing
All tool calls (success and failure, including validation failures) create an audit event.
You can inspect events with `GET /tools/audit/events` for local testing.

### OpenAPI
OpenAPI spec snapshot:
- `docs/tool-gateway-openapi.json`

### Local run and tests
```bash
uvicorn main:app --reload
pytest
```

### Example OpenClaw request
```json
{
  "agent_name": "openclaw-agent",
  "reason": "create invoice for completed order",
  "business_context": "B2B wholesale flow",
  "requested_action": "create_invoice",
  "ai_battery_estimate": 2.1,
  "tenant_id": "tenant-123",
  "user_id": "u-991",
  "request_id": "req-2026-0001",
  "human_approval_id": "ha-445",
  "payload": {
    "order_id": "ord-1001",
    "amount": 199.99
  }
}
```

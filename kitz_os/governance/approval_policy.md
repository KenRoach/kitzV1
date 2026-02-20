# Approval Policy

## Risk Levels

### Auto-Execute (Low Risk)
- CRM reads: list_contacts, get_contact, business_summary
- Order reads: list_orders, get_order
- Knowledge reads: list_knowledge, list_audit_log
- Dashboard: dashboard_metrics
- Report generation

### Execute + Confirm (Medium Risk)
- CRM writes: create_contact, update_contact
- Order writes: create_order, update_order
- Storefront creates: create_storefront, update_storefront
- Product creates: create_product, update_product
- Brain dump processing
- Document scanning

### Draft-First (High Risk)
- Outbound messaging: WhatsApp, email sends
- Mark storefront paid (6-step financial transaction)
- Email compose (admin_assistant only)

### Email Approval Required (Critical)
- Delete storefront
- Delete product
- Any security configuration change
- Agent configuration modifications
- Kill switch changes (via WhatsApp command)

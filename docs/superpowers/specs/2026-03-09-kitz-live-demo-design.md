# kitz-live-demo — Design Spec

## Purpose
60-second interactive demo simulating the full KitZ 7-step pipeline for prospects. Sales tool — every element builds confidence.

## Stack
React + Vite + Tailwind CSS + Lucide icons + Recharts. Pure frontend SPA (no backend).

## Pipeline Steps (animated sequentially)
1. WhatsApp message arrives (kitz-whatsapp-connector :3006)
2. Gateway auth + RBAC check (kitz-gateway :4000)
3. Semantic router classifies intent (kitz_os :3012)
4. LLM hub routes to best model (kitz-llm-hub :4010)
5. AOS agent processes request (aos — 30+ roles)
6. Workspace logs order to CRM (workspace :3001)
7. AI Battery deducts credits (real-time counter)

## Scenarios (swappable)
- Laptop quote request via WhatsApp
- Warranty renewal automation
- WhatsApp lead capture + CRM log

## Design
- Dark background (#0F0F0F)
- Purple primary (#7C3AED), accent (#A855F7)
- Monospace terminal energy
- Sequential step animation with data flowing between nodes
- AI Battery credit counter animating in real time
- Mobile-responsive

## Architecture
Pure simulation — no live API connections. All data is mock. Each scenario defines its own message content, agent role, and credit cost.

## Deployment
Vercel or Railway. Single static build.

# workspace.kitz.services — Design

**Date:** 2026-02-22
**Status:** Approved

## Overview

Mobile-first owner dashboard built in Lovable, connected to Supabase (`yjustozltqpsroxkjobf`), deployed at `workspace.kitz.services`. Full free-tier suite: CRM, Orders, Checkout Links, AI Direction, and Tasks.

## Architecture

```
User (mobile browser)
  -> workspace.kitz.services (Lovable-hosted React + Tailwind + shadcn/ui)
    -> Supabase Auth (email / magic link login)
    -> Supabase DB (direct via supabase-js + RLS)
       Tables: contacts, orders, checkout_links, tasks, ai_battery_usage
```

## Pages / Screens

| Route | Purpose |
|-------|---------|
| `/auth` | Supabase Auth — email + password |
| `/` (dashboard) | Overview: quick stats (contacts, orders today, battery balance), recent activity |
| `/contacts` | CRM — list, add, edit contacts. Name, phone (WhatsApp), email, notes |
| `/orders` | Order list — status tracking (pending, confirmed, delivered), linked to contact |
| `/checkout` | Create & manage mobile checkout links — amount, description, shareable URL |
| `/tasks` | Task board — simple list with status (todo, doing, done) |
| `/ai` | AI Direction — battery balance display, usage history, gated AI actions |

## Supabase Tables (with RLS)

- **`contacts`** — id, business_id, name, phone, email, notes, created_at
- **`orders`** — id, business_id, contact_id (FK), amount, status, description, created_at
- **`checkout_links`** — id, business_id, order_id (FK, optional), amount, description, short_url, status, created_at
- **`tasks`** — id, business_id, title, status (todo/doing/done), created_at
- **`ai_battery_usage`** — id, business_id, credits_used, action, created_at

All tables use `business_id` tenant key with RLS: `business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())`.

## Auth Flow

1. User visits `workspace.kitz.services`
2. Redirected to `/auth` if no session
3. Signs up / logs in via email + password (Supabase Auth)
4. Session stored in browser, supabase-js handles token refresh
5. RLS enforces data isolation per business (via `business_id` → `owner_id = auth.uid()`)

## Tech Choices

- **UI**: React + Tailwind CSS + shadcn/ui (Lovable default stack)
- **Data**: supabase-js client (direct connection, RLS for security)
- **Auth**: Supabase Auth (magic link + email/password)
- **Deploy**: Lovable preview URL -> point `workspace.kitz.services` CNAME to it
- **Sync**: Code syncs to `KenRoach/workspace` GitHub repo via Lovable

## Infrastructure Identifiers

- **Lovable project ID:** `0dd377df-8e0b-4ff3-84e5-220c400737d6`
- **Lovable URL:** https://lovable.dev/projects/0dd377df-8e0b-4ff3-84e5-220c400737d6
- **Supabase project:** `yjustozltqpsroxkjobf`
- **Supabase URL:** https://yjustozltqpsroxkjobf.supabase.co
- **Lovable preview:** https://preview--bizgenie-core.lovable.app
- **Lovable published:** https://bizgenie-core.lovable.app
- **GitHub repo:** KenRoach/workspace
- **Custom domains:** workspace.kitz.services, admin.kitz.services

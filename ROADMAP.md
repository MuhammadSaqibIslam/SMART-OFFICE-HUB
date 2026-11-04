# Smart Office Hub — Phase Roadmap

> Ye file project ko phases mein divide karti hai taake pata rahe kahan tak kaam hua aur agla kya hai.
> Status legend: ✅ Done · 🟡 Partial · ⬜ Not started
>
> _Last updated: 2026-11-04 (git history + code se reconstruct ki gayi, kyunki original plan file kabhi save nahi hui thi)._

---

## Overview

Smart Office Hub ek internal office management app hai. 7 modules hain (sidebar ke mutabiq):
Dashboard · Inventory · Hardware Assets · Employees · Purchase Requests · Activity Log · Settings.

**Database poori ready hai** — `supabase/migrations/` mein 11 tables + RLS policies ban chuki hain, aur `src/types/database.ts` mein sab ke TypeScript types mojood hain. Yani har module ka backend taiyar hai, bas UI + service layer banana baaqi hai.

---

## Phases

### ✅ Phase 1 — Foundation + Auth
_Commit: `c4094fd`_
- [x] Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui setup
- [x] Supabase client (`src/lib/supabase/client.ts`)
- [x] Auth: Login + Signup pages, `AuthContext`, `ProtectedRoute`
- [x] Layout: Sidebar, Header, AppLayout
- [x] Routing (`App.tsx`) — saare 7 modules ke routes
- [x] Theme (dark/light) via `ThemeContext`

### ✅ Phase 2 — Database Schema + Dashboard
_Commit: `7a36c45`_
- [x] 11 tables + RLS: profiles, inventory_categories/items/transactions, employees, hardware_assets, asset_assignments, asset_history, purchase_requests, purchase_request_items, activity_logs
- [x] TypeScript types for every entity (`src/types/database.ts`)
- [x] Dashboard page with KPI cards (queries inventory, purchase_requests, hardware_assets, activity_logs)
- [x] Activity-log write helper pattern established (services `activity_logs` mein insert karti hain)

### ✅ Phase 3 — Inventory Module
_Commits: `c0d3764`, `0f288d6`, `cb3ab61`, `b7edbc8`_
- [x] Inventory list page (search, filters, empty state)
- [x] Add/Edit item dialog (`InventoryFormDialog`)
- [x] Stock In / Stock Out dialog (`StockDialog`)
- [x] Stock history dialog (`StockHistoryDialog`)
- [x] Full service layer (`src/services/inventory.ts`) — CRUD + stock + history + activity logging
- [x] Category/Unit select label fix

---

> ⬇️ Yahan tak kaam HO CHUKA hai. Neeche wali phases abhi PENDING hain. ⬇️

---

### ✅ Phase 4 — Employees Module
- [x] `src/services/employees.ts` (Inventory service ke pattern pe) — CRUD + activity logging
- [x] Employees list page (search by name/ID/email, department + status filters, empty state)
- [x] Add/Edit employee dialog (full_name, employee_id, email, department, job_title, contact, joining_date, status, notes)
- [x] Delete confirmation + activity logging
- [x] Empty-string → null handling (keeps UNIQUE employee_id clean)
- [x] (Table + type already ready: `employees`)

### ✅ Phase 5 — Hardware Assets Module
- [x] `src/services/assets.ts` — assets CRUD + assignment + return + history + activity logging
- [x] Assets list page (search, type + status filters, "Assigned To" column)
- [x] Add/Edit asset dialog (12 fields, smart type dropdown, fixed footer, scrollable body)
- [x] Assign-to-employee flow (`asset_assignments`) + return flow (condition, accessories, notes)
- [x] Asset history view (`asset_history`) — created/assigned/returned/updated timeline
- [x] Activity logging
- [x] Shared `src/lib/assetTypes.ts` (types, statuses, return conditions)
- [x] (Tables ready: `hardware_assets`, `asset_assignments`, `asset_history` — no new migration)

### ✅ Phase 6 — Purchase Requests Module
- [x] `src/services/purchaseRequests.ts` — request + line items CRUD, status workflow, auto number
- [x] Requests list page (search by number, status filter, items summary, total qty)
- [x] Create/Edit dialog with multiple line items (`purchase_request_items`), inventory-pick or custom
- [x] Status workflow (draft → submitted → approved/rejected → ordered → received), only valid next steps shown
- [x] Detail dialog (items view + status actions)
- [x] Activity logging
- [ ] (Optional, deferred) "received" par inventory stock auto-update
- [x] (Tables ready: `purchase_requests`, `purchase_request_items` — no new migration)

### ✅ Phase 7 — Activity Log Page
- [x] Activity log timeline page with "Load more" pagination
- [x] Search + module (entity_type) filter
- [x] Shows WHO performed each action (performer name from profiles) + exact date/time
- [x] Per-entry delete (hover), multi-select + bulk delete (select-all checkbox, indeterminate state)
- [x] All modules (Phase 3–6) already log to `activity_logs` via their services
- [x] Migration 004: read-all-profiles policy + delete policy on `activity_logs`
- [x] (Table ready: `activity_logs`)

### ✅ Phase 8 — Settings Module
- [x] Profile settings (full name + profile photo upload; email + role read-only)
- [x] Appearance (Light/Dark theme toggle)
- [x] Change password (`auth.updateUser`)
- [x] Inventory categories manage (add/delete `inventory_categories`)
- [x] Header shows profile photo when set
- [x] Migration 005: insert/update/delete policies on `inventory_categories`
- [x] Profile photo reuses the `employee-photos` bucket (no new bucket)

### ⬜ Phase 9 — Missing Features + Polish & Deploy _(last)_
From the "Common Must-Have Features" checklist, 8/10 are done. Still missing:
- [ ] **Forgot Password** flow (`auth.resetPasswordForEmail` + reset page) — not yet present
- [ ] **Mobile responsive** sidebar (hamburger/drawer) — currently fixed `ml-64`, breaks on small screens
- [ ] Loading & error states sab pages par consistent (mostly done)
- [x] `npm run build` clean (TypeScript errors 0)
- [ ] Deploy (Vercel/Netlify) + env vars

---

## Current Status

**Phase 8 (Settings) tak mukammal.** Agla kaam **Phase 9 — missing features (Forgot Password, mobile responsive) + deploy**.

| Phase | Module | Status |
|------|--------|--------|
| 1 | Foundation + Auth | ✅ |
| 2 | DB Schema + Dashboard | ✅ |
| 3 | Inventory | ✅ |
| 4 | Employees | ✅ |
| 5 | Hardware Assets | ✅ |
| 6 | Purchase Requests | ✅ |
| 7 | Activity Log (view) | ✅ |
| 8 | Settings | ✅ |
| 9 | Forgot Password + Mobile + Deploy | ⬜ **NEXT** |

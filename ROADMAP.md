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

### ⬜ Phase 4 — Employees Module  _(agला kaam / NEXT)_
> Pehle isko banao kyunki Hardware Assets ke assignments employees pe depend karte hain.
- [ ] `src/services/employees.ts` (Inventory service ke pattern pe) — CRUD
- [ ] Employees list page (search, department/status filters)
- [ ] Add/Edit employee dialog (full_name, employee_id, email, department, job_title, contact, joining_date, status)
- [ ] Delete + activity logging
- [ ] (Table + type already ready: `employees`)

### ⬜ Phase 5 — Hardware Assets Module
> Employees par depend karta hai (assignment ke liye employee chahiye).
- [ ] `src/services/assets.ts` — assets CRUD + assignment + return + history
- [ ] Assets list page (type/status filters)
- [ ] Add/Edit asset dialog
- [ ] Assign-to-employee flow (`asset_assignments`) + return flow (condition, accessories)
- [ ] Asset history view (`asset_history`)
- [ ] Activity logging
- [ ] (Tables ready: `hardware_assets`, `asset_assignments`, `asset_history`)

### ⬜ Phase 6 — Purchase Requests Module
- [ ] `src/services/purchaseRequests.ts` — request + line items CRUD
- [ ] Requests list page (status filters: draft/submitted/approved/rejected/ordered/received)
- [ ] Create request dialog with multiple line items (`purchase_request_items`)
- [ ] Status workflow (submit → approve/reject → order → receive)
- [ ] (Optional) "received" par inventory stock auto-update
- [ ] Activity logging
- [ ] (Tables ready: `purchase_requests`, `purchase_request_items`)

### ⬜ Phase 7 — Activity Log Page
> Logging infra pehle se hai; yahan sirf VIEW banana hai.
- [ ] Activity log list page with pagination
- [ ] Filters (action type, entity_type, date range, performed_by)
- [ ] Baaqi modules (Phase 4–6) ki services mein bhi activity logging add karna (abhi sirf inventory logs karti hai)
- [ ] (Table ready: `activity_logs`)

### ⬜ Phase 8 — Settings Module
- [ ] Profile settings (name, email — `profiles` table)
- [ ] Theme preference (already `ThemeContext` hai, persist karna)
- [ ] Inventory categories manage (add/edit/delete `inventory_categories`)
- [ ] Change password
- [ ] (Table ready: `profiles`, `inventory_categories`)

### ⬜ Phase 9 — Polish & Deploy _(optional / last)_
- [ ] Loading & error states sab pages par consistent
- [ ] Mobile responsive pass
- [ ] `npm run build` clean (TypeScript errors 0)
- [ ] Lint clean (`npm run lint`)
- [ ] Deploy (Vercel/Netlify) + env vars

---

## Current Status

**Phase 3 (Inventory) tak mukammal.** Agla kaam **Phase 4 — Employees**.

| Phase | Module | Status |
|------|--------|--------|
| 1 | Foundation + Auth | ✅ |
| 2 | DB Schema + Dashboard | ✅ |
| 3 | Inventory | ✅ |
| 4 | Employees | ⬜ **NEXT** |
| 5 | Hardware Assets | ⬜ |
| 6 | Purchase Requests | ⬜ |
| 7 | Activity Log (view) | ⬜ |
| 8 | Settings | ⬜ |
| 9 | Polish & Deploy | ⬜ |

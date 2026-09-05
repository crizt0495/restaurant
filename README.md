# Restaurant Management System (RMS)

A production-ready Restaurant Management System built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

## Features

- **POS** — category sidebar (horizontal scroll on mobile), product grid with search & barcode, variants & modifiers, cart with per-item discount, order types (DINE_IN / TAKE_AWAY / DELIVERY / PICK_UP), table & customer selection, **global discount** (nominal/percent), **split payment** (up to 5 methods), receipt with configurable tax/service-charge, real-time loyalty auto-earn.
- **Orders** — list, search, status filter, realtime updates, detail with items/summary/payments, **refund** flow (per-amount, method, reason), cancel with reason.
- **Kitchen Display (KDS)** — NEW / PREPARING / READY columns, per-item status flow, elapsed timer, late-order warnings, realtime.
- **Tables** — floor plan cards, statuses, active order links, clear table.
- **Products & Categories** — full CRUD, variants, modifiers, stock tracking, favorites.
- **Inventory** — stock levels, **typed adjustments** (STOCK_IN / STOCK_OUT / ADJUSTMENT / TRANSFER / WASTE), low-stock, **stock opname** (DRAFT → SUBMITTED → APPROVED) with auto-adjust, **recipes (BOM)** with atomic deduction on sale.
- **Purchasing** — suppliers, purchase orders (DRAFT/PENDING/APPROVED/RECEIVED/PARTIAL/CANCELLED), receive flow, auto-increment stock.
- **Customers** — loyalty points (auto-earn from order), membership levels (BRONZE→PLATINUM), redeem rewards, quick-add from POS.
- **Employees & Shifts** — CRUD, attendance, schedule.
- **Cashier Shifts** — open/close, opening cash, expected vs actual, variance, owner notification.
- **Expenses** with custom categories.
- **Reservations** with status flow (PENDING/CONFIRMED/SEATED/COMPLETED/CANCELLED/NO_SHOW).
- **Promotions** — percentage/fixed/B1G1/Buy X Get Y/Happy Hour.
- **Reports** — Sales, Profit & Loss, Inventory, Product, Customer, **Purchase, Payment, Tax, Refund, Void, Shift, Branch, Category, Discount, Waiter, Kitchen, Stock Movement, Stock Opname, Expenses, Employees**; CSV/Print export.
- **Notifications** — realtime bell badge with unread count, mark-read, mark-all-read.
- **Audit Logs** UI with filtering by user, action, entity.
- **Settings** — restaurant, users, roles, branches, payment, **receipt format, notification preferences**.
- **QR menu** — unauthenticated `/menu/{branch}/{table}` self-ordering (validated server-side).
- **Atomic order creation** via Postgres `create_order_atomic` RPC with row-level locking (no race conditions on stock).
- **Auth & Authorization** — Username + Password login, role + permission matrix (42 permissions), multi-branch scoping, Row-Level Security, audit logging, account inactive check.
- **Dark mode**, **PWA-ready** (manifest + service worker).
- **Global search** (⌘K) across orders/products/customers/suppliers.
- **Loading skeletons** on dashboard, **paginated** lists, **debounced** search.
- **Print** with `no-print` / `receipt-print` CSS classes for thermal/PDF output.

## Tech Stack

- Next.js 16, App Router, React 19
- TypeScript
- Tailwind CSS v4 + shadcn-style primitives
- Supabase (Auth, Postgres, Realtime, Storage-ready)
- recharts, react-hook-form, zod, date-fns, react-hot-toast, next-themes, lucide-react
- Node test runner (built-in) for unit tests

## Getting Started

### 1. Supabase

Apply the database schema and seed:

```bash
# in supabase directory
supabase db reset
```

Or apply manually:

- `supabase/migrations/20260903000000_init.sql` — schema, RLS, triggers, functions, realtime.
- `supabase/migrations/20260905000001_atomic_order_rpc.sql` — atomic `create_order_atomic` function.
- `supabase/migrations/20260905000002_stock_opname_fix.sql` — adds `total_difference_value` column.
- `supabase/seed.sql` — demo org, branches, products, inventory, tables, permissions, role grants.

The `get_auth_email_by_username(username)` RPC is created by the init migration and is used by the username login flow (SECURITY DEFINER).

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side only
```

### 3. Seed demo accounts (dev only)

```bash
curl -X POST http://localhost:3000/api/seed
```

Creates login users (password is `<username>123!`):

| Username  | Role           |
|-----------|----------------|
| admin     | SUPER_ADMIN    |
| owner     | OWNER          |
| manager   | MANAGER        |
| cashier   | CASHIER        |
| waiter    | WAITER         |
| kitchen   | KITCHEN        |
| inventory | INVENTORY      |

This route returns `403` outside of development.

### 4. Run

```bash
npm install
npm run dev
```

Login at `/login` with username + password (e.g. `admin` / `admin123!`).

## Quality Gates

```bash
npm run lint      # ESLint
npm run typecheck # TypeScript checking
npm test          # Node test runner
npm run build     # Production build
```

All four must pass before deployment.

## Routing

```
/login
/menu/[branch]/[table]                  public QR menu

/dashboard
/pos
/orders                                  list
/orders/[id]                             detail
/orders/[id]/receipt                     printable receipt
/kitchen                                 KDS
/tables
/reservations

/products                                list
/products/categories
/recipes                                  BOM
/inventory
/inventory/opname
/purchases                                list
/purchases/[id]                          detail
/suppliers
/customers
/promotions
/employees
/employees/shifts
/expenses
/shifts                                    cashier shifts
/audit-logs
/reports                                   hub
/reports/{sales,profit,purchase,payment,inventory,products,customers,cashier,shift,branch,categories,discount,waiter,kitchen,refund,void,tax,stock-movement,stock-opname,expenses,employees}

/notifications
/settings
/settings/users
/settings/roles
/settings/branches
/settings/restaurant
/settings/payment
/settings/receipt
/settings/notifications
```

## Project Structure

```
supabase/migrations/   Database schema + RLS + triggers + functions + seed
src/app/               App Router pages & API routes
src/app/api/orders     Service-role order creation (QR menu) with validation
src/app/api/seed       Demo user seeding (dev only)
src/components/        Client components (POS, KDS, tables, etc.) + ui primitives
src/lib/actions/       Server actions (domain + auth + users)
src/lib/queries/       Data fetch helpers
src/lib/helpers.ts     Auth/permission/role helpers
src/lib/supabase/      Client/server/admin clients
src/config/navigation.ts  Sidebar & bottom navigation
src/types/             Types + permission matrix
tests/                 Unit tests (node:test)
public/                Static assets (manifest, sw)
```

## Key Business Logic (DB Functions)

- `create_order_atomic(text, uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, jsonb, jsonb)` — full transactional POS order: writes order, items, modifiers, payments, deducts stock from recipes (with row-level lock), updates table, sends notifications, writes audit log. All or nothing.
- `get_auth_email_by_username(p_username text)` — username → auth email mapper for login.
- `current_org_id()`, `current_profile()`, `current_branch_id()` — RLS-friendly helpers.
- `create_notification`, `log_audit` — convenience writers.

## Keyboard Shortcuts (POS)

- `F2` — focus product search
- `F4` — confirm add to cart
- `F8` — open payment dialog
- `Enter` — confirm payment
- `Esc` — close dialog
- `⌘K` / `Ctrl+K` — global search

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and used for: demo seeding, atomic order RPC, and the QR-menu public endpoint. It is never exposed to the browser.
- The atomic order RPC is `SECURITY DEFINER` and validates role and branch before writing.
- The QR menu endpoint validates branch is active and only inserts products that exist and are not soft-deleted.
- All write actions check permission (server-side, not just UI).

## Deploy to Vercel

Add the three env vars in the Vercel project settings and deploy. The service-role key is used server-side only and is never exposed to the browser.

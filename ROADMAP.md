# ROADMAP.md

# Family Finance — Development Roadmap

This roadmap describes the intended direction of the project.

It is a living document. Items should be checked off only after the functionality is actually implemented and reasonably validated.

---

# Phase 1 — Foundation

- [x] Create frontend application
- [x] Create backend application
- [x] Set up TypeScript
- [x] Set up PostgreSQL
- [x] Establish database migration workflow
- [x] Establish frontend/backend service structure
- [x] Connect repository to GitHub
- [x] Establish project-level Git workflow

Status: COMPLETE

---

# Phase 2 — Authentication

- [x] User authentication
- [x] Password hashing with bcrypt
- [x] JWT-based authentication
- [x] Frontend authentication context
- [x] Persist authentication state
- [x] Protected routes
- [x] Keep login outside dashboard layout
- [x] Multi-layered JWT session guard and automatic logout on token expiry
- [x] Session expired banner and prompt on login
- [x] Self-serve signup page (`/signup`) with duplicate account redirect
- [x] Google sign-in integration support
- [x] Interactive luxurious landing page (`/`) with 3D canvas wireframe sphere

Status: COMPLETE

---

# Phase 3 — Family Management

- [x] Family-member management
- [x] Add family members
- [x] Display active family members
- [x] Deactivate family members
- [x] Preserve historical relationships
- [x] Preserve global user accounts when removing family members
- [x] Remove the user's family membership when removing them from a family
- [x] Allow an existing account to be re-invited after family removal
- [x] Verify the existing account password when accepting a re-invitation
- [x] Reuse existing global accounts instead of creating duplicate users
- [x] Shareable 6-character family join codes
- [x] Interactive onboarding choice (`/onboarding`: Create New Family vs Join with Code)
- [x] Admin family code display with 1-click copy and regeneration

Status: COMPLETE

---

# Phase 4 — Transactions & Bank Statement Ingestion

- [x] Transaction database schema
- [x] Transaction categories
- [x] Create transaction API
- [x] Update transaction API
- [x] Soft-delete transaction API
- [x] Retrieve active transactions
- [x] Create transaction UI
- [x] Edit transaction UI
- [x] Remove transaction UI
- [x] Income/expense types
- [x] Family-member association
- [x] Transaction date
- [x] Search transactions
- [x] Category filter
- [x] Type filter
- [x] Summary totals
- [x] Custom animated dropdowns
- [x] Multi-format bank statement import (CSV, Excel `.xlsx`/`.xls`, and PDF `.pdf`)
- [x] Automatic encryption / password-protection detection across all statement file types
- [x] In-app bank password unlock modal with common bank password hints
- [x] Narration cleanup engine (UPI, POS, NEFT, IMPS, ATM)
- [x] Date, amount, and debit/credit normalization
- [x] Database deduplication against existing family records
- [x] 3-tier categorization engine (family learned history, 120+ Indian & global brand keywords, fallback)
- [x] Self-learning `merchant_category_mappings` table
- [x] Interactive 2-step staging table modal with editable categories and bulk import

Status: COMPLETE

---

# Phase 5 — Design System & UI Polish

- [x] Establish dark-blue/blush-pink brand palette
- [x] Establish Plus Jakarta Sans typography
- [x] Refresh dashboard layout background
- [x] Redesign sidebar
- [x] Add collapsible desktop sidebar
- [x] Refresh custom dropdown styling
- [x] Refresh transaction item styling
- [x] Refresh transaction modal styling
- [x] Refresh transactions page styling
- [x] Finish visual refresh across all remaining pages
- [x] Establish consistent empty/loading/error states across the application
- [x] Review responsive behavior across major pages
- [x] Perform overall UI consistency pass

Status: COMPLETE

---

# Phase 6 — Dashboard

The dashboard should become the central family-finance overview.

Planned functionality:

- [x] Net savings/financial overview (income minus expenses, not a bank balance)
- [x] Total income
- [x] Total expenses
- [x] Recent transactions
- [x] Spending by category
- [x] Income vs expense overview
- [x] Useful month context and period selector
- [x] Family-level spending summary
- [x] Clear navigation into transactions
- [x] Responsive dashboard design
- [x] Protected backend aggregation API and loading, empty, and error states

The exact dashboard metrics and visualizations should be decided before implementation rather than adding charts without a product purpose.

Status: COMPLETE

---

# Phase 7 — Family Roles & Authorization

Family membership roles, backend authorization, frontend role management, and transaction role restrictions are complete and validated.

The family-membership lifecycle is already handled separately: removing a person from a family does not delete their global account, and an existing account can be re-invited to the family after its membership is removed.

Current authorization enforcement:
- family-member viewing requires authentication;
- family-member creation is admin-only;
- family-member editing is admin-only;
- family-member deactivation is admin-only;
- invitation creation is admin-only;
- transaction viewing is available to `admin`, `member`, and `viewer`;
- transaction creation, editing, and removal are available to `admin` and `member` only.

Role-management rules:
- only admins can change roles;
- admins can change another connected non-admin member to `admin`, `member`, or `viewer`;
- admins cannot change their own role;
- admins cannot change another admin's role;
- members and viewers cannot change roles.

Planned functionality:

- [x] Store family membership roles
- [x] Create invited accounts as `member`
- [x] Expose current user's family role through `GET /api/family/me`
- [x] Load family role into frontend authentication state
- [x] Display the actual role in the sidebar
- [x] Display family-member roles in Family management
- [x] Backend role authorization middleware/helper
- [x] Admin-only family member creation
- [x] Admin-only family member editing
- [x] Admin-only family member deactivation
- [x] Admin-only invitation creation
- [x] Admin role management with self/admin restrictions
- [x] Define member permissions
- [x] Define viewer read-only permissions
- [x] Apply permissions consistently to transaction operations
- [x] Add authorization tests for each protected role/operation
- [x] Handle transaction authorization errors inside the relevant action UI

Status: COMPLETE

---


---

# Phase 8 — AI Financial Intelligence

AI is being added as a dedicated phase before Budget Management. The features below are intentionally split into separate milestones and should be implemented and validated one at a time.

## AI-1 — AI Financial Assistant

- [x] Select AI provider/API (local Ollama with qwen2.5:3b)
- [x] Define backend AI service structure
- [x] Define authenticated, family-scoped financial tools
- [x] Implement tool/function calling
- [x] Add initial tools for common financial questions
- [x] Prevent direct database access by the model
- [x] Prevent arbitrary model-generated SQL execution
- [x] Add frontend financial chat UI
- [x] Add backend-only AI environment variables
- [x] Handle provider errors, timeouts, and rate limits
- [x] Multi-round tool calling loop with concurrency and safe error recovery
- [x] Test AI endpoints with Postman and frontend chat

Status: COMPLETE

## AI-2 — AI Financial Insights

- [x] Define deterministic financial metrics in backend
- [x] Feed validated metrics to the AI
- [x] Generate natural-language spending insights
- [x] Keep backend calculations authoritative
- [x] Add insight UI

Status: COMPLETE

## AI-3 — AI Monthly Financial Summary

- [x] Add specific month picker to dashboard (last 6 calendar months)
- [x] Support YYYY-MM period format in dashboard and insights backends
- [x] Add lazy-loaded AI narrative summary card on the dashboard
- [x] Narrative loads after dashboard data without blocking rendering

Status: COMPLETE

## AI-4 — AI Anomaly Detection

- [x] Define deterministic/statistical anomaly rules (outlier transactions, velocity spikes, category surges, new categories)
- [x] Detect unusual spending patterns using PostgreSQL baselines and TypeScript logic
- [x] Pass validated anomaly results to the AI for plain-English synthesis
- [x] Generate human-readable explanations with deterministic fallbacks
- [x] Add Anomaly Radar presentation UI integrated directly into the AI Insights page

Status: COMPLETE

## AI-5 — AI Family Spending Insights

- [x] Define family-level aggregation requirements
- [x] Compare useful member/category/period patterns
- [x] Generate family spending observations
- [x] Add family insight UI

Status: COMPLETE

## AI-6 — AI Dashboard / Ask About My Finances

- [x] Consolidate reusable financial tools
- [x] Add dashboard-level AI entry point
- [x] Support natural-language questions across supported financial data
- [x] Preserve authentication, authorization, and family scoping
- [x] Add useful contextual responses without replacing deterministic dashboard metrics

Status: COMPLETE

## AI-7 — AI Budget Recommendations

This milestone depends on Budget Management.

- [x] Analyze validated historical spending
- [x] Suggest category/period budget amounts
- [x] Explain the factors behind recommendations
- [x] Keep recommendations advisory rather than authoritative financial calculations
- [x] Interactive AI recommendation review and 1-click batch application

Status: COMPLETE

## AI-8 — AI Budget Risk Detection

This milestone depends on Budget Management and its spending-tracking model.

- [x] Compare current spending against budget
- [x] Calculate deterministic budget progress/projections
- [x] Detect potential overspending risk
- [x] Use AI to explain the risk and contributing factors
- [x] Add budget-risk UI/alerts where appropriate

Status: COMPLETE

### AI Scope Exclusions

The current AI phase does **not** include:
- transaction categorization;
- transaction description/merchant analysis.

### AI Architecture Rules

- Backend calculations remain the source of truth.
- AI accesses financial information through explicit backend tools/function calls.
- The AI must not directly access PostgreSQL.
- Arbitrary model-generated SQL must never be executed.
- AI requests and tools must be authenticated and family-scoped.
- Only minimum necessary financial data should be sent to the model.
- Provider API keys remain backend-only.
- Tool inputs/outputs must be validated.
- Sensitive financial information should not be unnecessarily logged.
- AI endpoints should have suitable rate limiting and provider-failure handling.

---

# Phase 9 — Budget Management

The budget system allows families to plan spending rather than only record it. Category spending limits, live tracking against expenses, remaining buffers, overspending alerts, unbudgeted spending breakdowns, dashboard widgets, and AI tool integration are implemented and validated.

Planned functionality:

- [x] Budget database design
- [x] Budget API
- [x] Create budget
- [x] Edit budget
- [x] Delete/deactivate budget where appropriate
- [x] Category-based budgets
- [x] Budget period (discrete calendar months YYYY-MM)
- [x] Budget amount
- [x] Track spending against budget
- [x] Remaining budget
- [x] Budget progress indicators
- [x] Overspending indication
- [x] Budget page UI
- [x] Budget integration with dashboard

Budget design decisions:
- Discrete calendar months (YYYY-MM) with independent monthly allocations (no auto-rollover).
- 1-click convenience utility to copy previous month's budget allocations.
- Admin and Member can create, update, and delete; Viewer is read-only.
- Grounded `get_budget_status` AI tool for natural language inquiries.

Status: COMPLETE

---

# Phase 10 — Settings & Workspace Preferences

Complete configuration suite for accounts, family spaces, custom categories, and data management:

- [x] Profile display name update with reactive state synchronization
- [x] Secure password change with current password validation and bcrypt hashing
- [x] Family space rename (Admin-only)
- [x] Family access code display, 1-click copy, and regeneration
- [x] Custom household categories creation and deletion for both expense and income
- [x] Live local Ollama engine health check (`qwen2.5:3b`)
- [x] AI chat history clearing
- [x] One-click transaction data export in RFC-4180 CSV format
- [x] Removal of redundant Reports section (consolidated into Dashboard & AI Insights)

Status: COMPLETE

---

# Phase 11 — Recurring Transactions & Subscriptions

Complete recurring transaction and subscription tracking system:

- [x] Design recurring transaction model (`recurring_transactions` table with frequency & status constraints)
- [x] Frequency rules (daily, weekly, monthly, quarterly, yearly) with month-end rollover handling
- [x] Due-date calculation and next execution tracking (`days_until_due` computation)
- [x] Automatic or 1-click transaction generation (`recordSingleRecurringNow` and batch `processDueRecurringTransactions`)
- [x] Edit/pause/resume/cancel recurring transaction
- [x] Recurring transactions page UI (`/recurring`) & upcoming urgent bill radar
- [x] Subscription tracking & recurring monthly expense summaries
- [x] AI Tool Grounding: `get_upcoming_bills` integrated into local Ollama assistant

Status: COMPLETE

---

# Phase 12 — Notifications & Financial Alerts

Comprehensive in-app notification center and automated financial alert trigger engine:

- [x] Budget nearing limit (amber warning when category spending reaches ≥ 80% of limit)
- [x] Budget exceeded (critical rose alert when category spending exceeds 100% of limit)
- [x] Recurring bill due soon alerts (warning for commitments due today or within 1–3 days)
- [x] Recurring bill overdue alerts (critical alert for past due unpaid bills)
- [x] Notification model (`notifications` table with metadata, severity, and family scoping)
- [x] Automated alert sync engine with smart cycle deduplication guard
- [x] Notification REST API endpoints with unread counting and role authorization
- [x] In-app notification bell with live badge counter in desktop sidebar and mobile header
- [x] Slide-over Notification Center drawer with filter tabs (All, Unread, Budgets, Bills)
- [x] Optimistic read/unread toggling, individual dismissal, clear read, and clear all
- [x] Deep links navigating straight to `/budgets` and `/recurring`

Status: COMPLETE

---

# Phase 13 — Advanced Data Export & Reports

Comprehensive multi-format data export engine with granular filters and official PDF statement generation:

- [x] Basic RFC-4180 CSV transaction export with UTF-8 BOM encoding
- [x] Date-range filtered export (presets for This Month, Last Month, Last 3 Months, This Year, All Time, and custom date pickers)
- [x] Category, member, and transaction type (`income` vs `expense`) filtered exports
- [x] Multi-sheet Excel workbook export (`.xlsx` via `xlsx` with Executive Summary KPI tab and All Transactions tab)
- [x] Formatted PDF financial summary statement export (`.pdf` via `pdfkit` with branded header, 3-card KPI overview, category spending breakdown table, and transaction history)
- [x] Live scope preview endpoint (`GET /api/reports/preview`)
- [x] Interactive Export Modal (`ExportModal.tsx`) integrated in Transactions (`/transactions`) and Settings (`/settings`)

Status: COMPLETE

---

# Phase 14 — DevOps & Production Deployment

DevOps is a dedicated future learning phase. It should begin after the major application functionality is sufficiently complete, rather than being started alongside the current AI work. The purpose is to learn how to take the application from a working local project to a repeatable, observable production deployment.

This phase should be implemented as hands-on project work rather than simply using a one-click hosting service.

Planned functionality and learning goals:

- [ ] Learn Docker fundamentals
- [ ] Dockerize the backend
- [ ] Dockerize the frontend
- [ ] Create Docker Compose configuration for local multi-service development
- [ ] Separate development and production configuration
- [ ] Manage production environment variables
- [ ] Set up production PostgreSQL
- [ ] Run database migrations safely during deployment
- [ ] Deploy the backend
- [ ] Deploy the frontend
- [ ] Configure frontend-to-backend communication in production
- [ ] Configure production CORS
- [ ] Configure domain/DNS
- [ ] Configure HTTPS/TLS
- [ ] Learn GitHub Actions fundamentals
- [ ] Build a CI pipeline for install/build/type-check/lint/tests as applicable
- [ ] Build a CD pipeline for deployment
- [ ] Build and use Docker images in the deployment workflow
- [ ] Manage production secrets securely
- [ ] Add backend health-check endpoint(s)
- [ ] Establish production logging
- [ ] Add basic application/infrastructure monitoring
- [ ] Define database backup strategy
- [ ] Define rollback strategy
- [ ] Practice production troubleshooting
- [ ] Document the deployment architecture and operational workflow

The exact cloud provider and hosting architecture should be chosen when this phase begins, based on the learning goals and the project's actual requirements.

Status: FUTURE

---

# Phase 15 — Production Hardening & Portfolio Readiness

After deployment is working, perform a final production-readiness pass across the deployed system.

- [ ] Comprehensive validation/error handling review
- [ ] Authentication/security review
- [ ] Authorization review
- [ ] Database constraint review
- [ ] API error consistency
- [ ] Frontend error/loading/empty states
- [ ] Responsive review
- [ ] Accessibility review
- [ ] Performance review
- [ ] Production environment-variable/secrets review
- [ ] Verify deployment and rollback procedures
- [ ] Strong README
- [ ] Architecture documentation
- [ ] Deployment documentation
- [ ] Screenshots/demo material

Status: FUTURE

---

# Suggested Order

Unless a new product requirement changes priorities, the recommended development order is:

1. AI Financial Intelligence (Complete)
2. Budget Management (Complete)
3. Settings & Workspace Preferences (Complete - Reports consolidated)
4. Recurring Transactions & Subscriptions (Complete)
5. Notifications & Financial Alerts (Planned next)
6. Advanced Data Export
7. DevOps & Production Deployment
8. Production Hardening & Portfolio Readiness

The order can change when there is a strong technical or product reason.

---

# Design & Layout Rules

- Before designing a new page, research current inspiration from Pinterest, Dribbble, Behance, and modern SaaS/fintech products. Adapt ideas to Family Finance rather than copying them.
- Do not use whole-page left/right split layouts on desktop. Prefer a single vertical flow; internal grids remain allowed.
- Check hover, animation, stacking context, z-index, overflow, clipping, and open/closed behavior for interactive UI before considering the page complete.

# Roadmap Rules

- Do not implement every future idea immediately.
- Complete and validate one meaningful milestone at a time.
- Before starting a phase, inspect the current implementation and database model.
- Update this file when a milestone changes status.
- After a meaningful milestone is completed and tested, remind the user to commit and push it to GitHub before starting the next substantial feature.
- Add new roadmap items only when they represent a deliberate product decision.

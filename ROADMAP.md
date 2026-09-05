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

Status: COMPLETE

---

# Phase 3 — Family Management

- [x] Family-member management
- [x] Add family members
- [x] Display active family members
- [x] Deactivate family members
- [x] Preserve historical relationships

Status: COMPLETE

---

# Phase 4 — Transactions

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
- [ ] Finish visual refresh across all remaining pages
- [ ] Establish consistent empty/loading/error states across the application
- [ ] Review responsive behavior across major pages
- [ ] Perform overall UI consistency pass

Status: IN PROGRESS

---

# Phase 6 — Dashboard

The dashboard should become the central family-finance overview.

Planned functionality:

- [ ] Total balance/financial overview
- [ ] Total income
- [ ] Total expenses
- [ ] Recent transactions
- [ ] Spending overview
- [ ] Income vs expense overview
- [ ] Useful date/month context
- [ ] Family-level financial summary
- [ ] Clear navigation into transactions, budgets, and reports
- [ ] Responsive dashboard design

The exact dashboard metrics and visualizations should be decided before implementation rather than adding charts without a product purpose.

Status: PLANNED

---

# Phase 7 — Budget Management

The budget system should allow families to plan spending rather than only record it.

Planned functionality:

- [ ] Budget database design
- [ ] Budget API
- [ ] Create budget
- [ ] Edit budget
- [ ] Delete/deactivate budget where appropriate
- [ ] Category-based budgets
- [ ] Budget period
- [ ] Budget amount
- [ ] Track spending against budget
- [ ] Remaining budget
- [ ] Budget progress indicators
- [ ] Overspending indication
- [ ] Budget page UI
- [ ] Budget integration with dashboard

Important future decision:
Budget periods and rollover behavior should be explicitly designed before implementation.

Status: PLANNED

---

# Phase 8 — Reports & Analytics

Reports should turn transaction data into useful financial insight.

Planned functionality:

- [ ] Reports database/API requirements
- [ ] Monthly income vs expense
- [ ] Category spending breakdown
- [ ] Spending trends
- [ ] Family-member spending breakdown
- [ ] Date-range filtering
- [ ] Report summary cards
- [ ] Useful charts/visualizations
- [ ] Reports page UI
- [ ] Connect reports to dashboard insights

Charts should be added only where they communicate something useful.

Status: PLANNED

---

# Phase 9 — Recurring Transactions

Potential recurring transaction system:

- [ ] Design recurring transaction model
- [ ] Frequency rules
- [ ] Start/end dates
- [ ] Automatic transaction generation
- [ ] Edit recurring transaction
- [ ] Disable recurring transaction
- [ ] UI for recurring transactions

This should be designed carefully because recurring transactions affect database behavior and financial correctness.

Status: PLANNED

---

# Phase 10 — Notifications & Financial Alerts

Potential alerts:

- [ ] Budget nearing limit
- [ ] Budget exceeded
- [ ] Other useful financial reminders
- [ ] Notification model
- [ ] Notification UI
- [ ] Read/unread state

Notifications should be added only after the underlying budget/report functionality is stable.

Status: FUTURE

---

# Phase 11 — Data Export

Potential functionality:

- [ ] Export transactions
- [ ] CSV export
- [ ] Potential report export
- [ ] Date-range export
- [ ] Filter-aware export

Status: FUTURE

---

# Phase 12 — Production Readiness

Before considering the application portfolio-ready:

- [ ] Comprehensive validation/error handling review
- [ ] Authentication/security review
- [ ] Authorization review
- [ ] Database constraint review
- [ ] API error consistency
- [ ] Frontend error/loading/empty states
- [ ] Responsive review
- [ ] Accessibility review
- [ ] Performance review
- [ ] Environment-variable review
- [ ] Production deployment
- [ ] Production database
- [ ] Deployment documentation
- [ ] Strong README
- [ ] Architecture documentation
- [ ] Screenshots/demo material

Status: FUTURE

---

# Suggested Order

Unless a new product requirement changes priorities, the recommended development order is:

1. Finish global UI consistency
2. Dashboard
3. Budgets
4. Reports & analytics
5. Recurring transactions
6. Notifications/alerts
7. Export
8. Production hardening and deployment

The order can change when there is a strong technical or product reason.

---

# Roadmap Rules

- Do not implement every future idea immediately.
- Complete and validate one meaningful milestone at a time.
- Before starting a phase, inspect the current implementation and database model.
- Update this file when a milestone changes status.
- Add new roadmap items only when they represent a deliberate product decision.

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
- [x] Preserve global user accounts when removing family members
- [x] Remove the user's family membership when removing them from a family
- [x] Allow an existing account to be re-invited after family removal
- [x] Verify the existing account password when accepting a re-invitation
- [x] Reuse existing global accounts instead of creating duplicate users

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

Family membership roles are stored and displayed, and the initial backend authorization layer is now implemented. This phase remains in progress until member/viewer permissions are explicitly defined, transaction operations are role-restricted accordingly, and authorization tests are added.

The family-membership lifecycle is already handled separately: removing a person from a family does not delete their global account, and an existing account can be re-invited to the family after its membership is removed.

Current authorization enforcement:
- family-member creation is admin-only;
- family-member editing is admin-only;
- family-member deactivation is admin-only;
- invitation creation is admin-only;
- family-member retrieval requires authentication.

Planned functionality:

- [x] Store family membership roles
- [x] Create invited accounts as `member`
- [x] Expose current user's family role through `GET /api/family/me`
- [x] Load family role into frontend authentication state
- [x] Display the actual role in the sidebar
- [x] Backend role authorization middleware/helper
- [x] Admin-only family member creation
- [x] Admin-only family member editing
- [x] Admin-only family member deactivation
- [x] Admin-only invitation creation
- [ ] Define member permissions
- [ ] Define viewer read-only permissions
- [ ] Apply permissions consistently to transaction operations
- [ ] Add authorization tests for each protected role/operation

Status: IN PROGRESS

---

# Phase 8 — Budget Management

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

# Phase 9 — Reports & Analytics

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

# Phase 10 — Recurring Transactions

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

# Phase 11 — Notifications & Financial Alerts

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

# Phase 12 — Data Export

Potential functionality:

- [ ] Export transactions
- [ ] CSV export
- [ ] Potential report export
- [ ] Date-range export
- [ ] Filter-aware export

Status: FUTURE

---

# Phase 13 — Production Readiness

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

1. Role-based authorization and permission enforcement
2. Budget management
3. Reports & analytics
4. Recurring transactions
5. Notifications/alerts
6. Data export
7. Production hardening and deployment

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

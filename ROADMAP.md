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

- [ ] Select AI provider/API
- [ ] Define backend AI service structure
- [ ] Define authenticated, family-scoped financial tools
- [ ] Implement tool/function calling
- [ ] Add initial tools for common financial questions
- [ ] Prevent direct database access by the model
- [ ] Prevent arbitrary model-generated SQL execution
- [ ] Add frontend financial chat UI
- [ ] Add backend-only AI environment variables
- [ ] Handle provider errors, timeouts, and rate limits
- [ ] Test AI endpoints with Postman

Status: NEXT

## AI-2 — AI Financial Insights

- [ ] Define deterministic financial metrics in backend
- [ ] Feed validated metrics to the AI
- [ ] Generate natural-language spending insights
- [ ] Keep backend calculations authoritative
- [ ] Add insight UI

Status: PLANNED

## AI-3 — AI Monthly Financial Summary

- [ ] Define monthly summary data contract
- [ ] Generate monthly income/expense summary
- [ ] Include useful category/trend context
- [ ] Add summary UI or dashboard integration

Status: PLANNED

## AI-4 — AI Anomaly Detection

- [ ] Define deterministic/statistical anomaly rules
- [ ] Detect unusual spending or transaction patterns
- [ ] Pass validated anomaly results to the AI
- [ ] Generate human-readable explanations
- [ ] Add anomaly presentation UI

Status: PLANNED

## AI-5 — AI Family Spending Insights

- [ ] Define family-level aggregation requirements
- [ ] Compare useful member/category/period patterns
- [ ] Generate family spending observations
- [ ] Add family insight UI

Status: PLANNED

## AI-6 — AI Dashboard / Ask About My Finances

- [ ] Consolidate reusable financial tools
- [ ] Add dashboard-level AI entry point
- [ ] Support natural-language questions across supported financial data
- [ ] Preserve authentication, authorization, and family scoping
- [ ] Add useful contextual responses without replacing deterministic dashboard metrics

Status: PLANNED

## AI-7 — AI Budget Recommendations

This milestone depends on Budget Management.

- [ ] Analyze validated historical spending
- [ ] Suggest category/period budget amounts
- [ ] Explain the factors behind recommendations
- [ ] Keep recommendations advisory rather than authoritative financial calculations

Status: PLANNED

## AI-8 — AI Budget Risk Detection

This milestone depends on Budget Management and its spending-tracking model.

- [ ] Compare current spending against budget
- [ ] Calculate deterministic budget progress/projections
- [ ] Detect potential overspending risk
- [ ] Use AI to explain the risk and contributing factors
- [ ] Add budget-risk UI/alerts where appropriate

Status: PLANNED

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

The budget system should allow families to plan spending rather than only record it. AI budget recommendations and budget risk detection will build on this system later.

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

# Phase 10 — Reports & Analytics

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

# Phase 13 — DevOps & Production Deployment

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

# Phase 14 — Production Hardening & Portfolio Readiness

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

1. AI Financial Intelligence
2. Budget management
3. Reports & analytics
4. Recurring transactions
5. Notifications/alerts
6. Data export
7. DevOps & production deployment
8. Production hardening & portfolio readiness

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

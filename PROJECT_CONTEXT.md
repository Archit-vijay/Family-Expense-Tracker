# PROJECT_CONTEXT.md

# Family Finance — Project Context

## Purpose

Family Finance is a full-stack application for managing a family's income and expenses.

The project has two goals:
1. Learn full-stack development by building a real application end to end.
2. Produce a polished portfolio project with a coherent architecture and professional UI.

The application is intended to grow beyond a basic CRUD expense tracker into a useful family-finance product with budgeting and reporting capabilities.

---

# Current Technology

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- react-router-dom

## Backend

- Node.js
- Express
- TypeScript
- JWT
- bcrypt

## Database

- PostgreSQL
- pgAdmin is used during development/testing.
- Database changes are represented by SQL migration files.

---

# Completed Work

## 1. Project Foundation

The repository and application foundation were created.

The initial meaningful Git milestone was:

`feat: build family finance application foundation`

The foundation includes the frontend/backend separation, TypeScript setup, PostgreSQL integration, authentication foundation, routing, services/types, and the initial application structure.

---

## 2. Authentication

Authentication is implemented using JWT and bcrypt.

Current behavior includes:
- user authentication,
- JWT token handling,
- frontend authentication state,
- localStorage persistence for token/user state,
- protected frontend routes.

The application has a `ProtectedRoute` and `AuthContext`.

The invitation acceptance flow can establish a normal authenticated session immediately after account creation. `AuthContext` exposes the authenticated user's family role and loads it from `GET /api/family/me`.

Unauthenticated direct navigation to `/dashboard` was fixed so protected pages cannot simply be opened without authentication.

The login page is intentionally separate from the dashboard layout and does not display the dashboard sidebar.

---

## 3. Family Invitations & Membership Roles

Family invitations are implemented end to end.

### Database

Migration `012_create_family_invitations.sql` creates `family_invitations` with:
- family association,
- family-member association,
- invited email,
- secure unique invitation token,
- expiry timestamp,
- accepted timestamp,
- creation timestamp.

Invitations currently expire after 48 hours. Pending invitations for the same family member are replaced/expired when a new invitation is created.

### Backend

Invitation functionality includes:
- authenticated admin-only invitation creation,
- public invitation lookup by token,
- validation of token state and expiry,
- transactional invitation acceptance,
- bcrypt password hashing,
- creation of the invited user's account,
- linking the existing family-member record to the new user,
- creation of a `family_memberships` row with role `member`,
- marking the invitation as accepted,
- issuing a normal 7-day JWT after successful acceptance.

Invitation tokens are secure random identifiers and are separate from JWTs and the JWT signing secret.

### Frontend

The frontend includes:
- `invitationService.ts` for create, lookup, and acceptance API calls,
- `/invite/:token` for the invitation acceptance page,
- automatic authenticated session setup after successful invitation acceptance,
- family role loading through `familyService.ts`.

The sidebar now displays the actual family role as `Family Admin`, `Family Member`, or `Family Viewer` rather than hardcoding every user as an admin.

The current role display is informational. Backend authorization still needs to be implemented before roles can be relied on to restrict operations.

---

## 4. Family Management

Family-member management is implemented.

The family feature supports adding/managing family members.

Important business rule:

Family members are deactivated instead of hard-deleted.

The database has:

`is_active BOOLEAN NOT NULL DEFAULT TRUE`

Family-member retrieval only returns active members.

This preserves historical relationships and transaction history.

Meaningful Git milestone:

`feat: add family member management`

---

## 5. Transaction System

The transaction feature is implemented end to end.

### Database

The transactions table contains relationships to:
- family,
- family member,
- category,
- user who created the transaction.

It also contains:
- title,
- amount,
- type,
- transaction date,
- created/updated timestamps.

The database validates:
- positive amounts,
- valid transaction types.

Transaction soft deletion was later added with:

`is_deleted BOOLEAN NOT NULL DEFAULT FALSE`

### Backend

Transaction functionality includes:
- GET transactions
- POST/create transaction
- PUT/update transaction
- DELETE/deactivate transaction

Routes are protected by authentication middleware.

The controller validates transaction input and scopes transaction retrieval, updates, and soft removal to the authenticated user's family.

The service filters out soft-deleted transactions from normal transaction retrieval.

### Frontend

The transaction page supports:
- viewing transactions,
- adding transactions,
- editing transactions,
- removing transactions,
- searching,
- category filtering,
- income/expense type filtering,
- summary totals,
- family-member association,
- transaction dates.

Transaction data is represented by a `Transaction` TypeScript type with:
- id
- title
- amount
- type
- date
- category
- categoryId
- member
- memberId

The transaction modal supports both add and edit modes.

Transaction date defaults to the current date but can be changed by the user.

Categories are filtered according to transaction type.

---

# UI / UX Work Completed

## Brand Palette

The dark-blue/blush-pink palette has been applied across the current application UI:

- Dark blue: `#2A234F`
- Dark-blue hover: `#1F1A3B`
- Blush pink: `#FFB3C3`
- Blush hover: `#FF9FB4`
- Page background: `#F8F7FB`
- White cards: `#FFFFFF`
- Main text: `#2A234F`
- Secondary text: `#77738A`
- Borders: `#E8E5EF`

The intended visual balance is approximately:
- 70% neutral surfaces,
- 20% dark blue,
- 10% blush pink.

Emerald remains the semantic color for income/success and rose/red remains the semantic color for destructive actions.

Do not treat the brand palette as a replacement for semantic status colors.

The palette refresh now covers global surfaces, the login page, desktop and mobile navigation, the dashboard and its chart components, transaction UI, family management, and the current budget/report/settings placeholder pages. Chart surfaces and interactive states use the same palette; data/status colors remain semantic where applicable.

Shared loading, empty, and error-state presentation is now used across the data-backed family and transaction pages, and the current placeholder pages use the same empty-state treatment. Mobile navigation is available through a dedicated drawer, while the desktop sidebar retains its collapsible behavior.

---

## Page Layout & Design Research

New pages should be designed after researching current inspiration from Pinterest, Dribbble, Behance, and modern SaaS/fintech products. Ideas should be adapted to Family Finance rather than copied.

Whole-page desktop left/right split layouts are not used. New pages should favor a single vertical flow, while internal grids for cards and metrics remain acceptable. Interactive UI should be checked for hover, animation, stacking, z-index, overflow, clipping, and open/closed-state behavior before being considered complete.

## Typography

The chosen font is:

**Plus Jakarta Sans**

It is used as the primary application font.

---

## Login Page

The original split-screen/3D concepts were abandoned.

The current direction is a full-page editorial-style layout using a slow animated linear gradient.

The gradient direction uses the dark-blue/purple/blush palette rather than a hard left/right color split.

The page has:
- branding,
- a prominent headline,
- login form/card,
- supporting feature/footer content.

A cursor-following glow was tried and rejected.

A circular gradient approach was also rejected.

The design preference is a controlled, normal linear gradient with subtle motion.

---

## Sidebar

The desktop sidebar was redesigned to resemble a modern collapsible application sidebar.

Behavior:
- expanded: `w-72`
- collapsed: `w-20`
- animated width transition,
- labels disappear when collapsed,
- icons remain visible,
- tooltips use the native `title` attribute,
- user section becomes compact when collapsed,
- user menu closes when collapsing,
- the pink `F` logo acts as the expand control when collapsed,
- expanded state has a collapse control.

Mobile sidebar/header behavior remains separate.

On mobile, the header provides a dedicated navigation drawer containing the same primary routes as the desktop sidebar.

Current sidebar palette uses the dark blue as the dominant surface and blush pink for the brand/logo accent.

---

## Custom Animated Dropdown

A reusable `AnimatedDropdown` component was created.

It provides:
- custom dropdown UI,
- outside-click closing,
- smart positioning,
- upward placement when there is insufficient space below,
- scrollable menu,
- fade/scale/translate animation,
- selected-option styling.

It is used instead of native selects in relevant transaction UI.

---

## Shared Content States

The reusable `ContentState` component provides consistent loading, empty, and error presentation.

It is used by the Family and Transactions pages and supplies the current placeholder states for Budgets, Reports, and Settings. New asynchronous pages should use the same treatment unless they have a documented reason to differ.

---

## Transaction Item

Transaction list items have:
- income/expense icons,
- semantic income/expense colors,
- category badge,
- member/date information,
- amount,
- animated action menu,
- edit action,
- remove action.

The action menu closes when clicking outside.

The transaction item styling has been updated to the new design palette while preserving semantic income/expense colors.

---

## Add/Edit Transaction Modal

The modal supports:
- add mode,
- edit mode,
- validation,
- title,
- amount,
- transaction type,
- category,
- family member,
- date.

Its styling was updated to the new palette.

The modal uses the custom animated dropdown.

The existing validation and API behavior must be preserved during future UI changes.

---

## Transactions Page

The Transactions page styling has been updated to the new palette.

It includes:
- page header,
- Add transaction button,
- transaction summary cards,
- search,
- category dropdown,
- type dropdown,
- active filter information,
- transaction list,
- loading state,
- error state,
- empty state,
- add/edit modal,
- remove confirmation modal.

The transaction milestone is functionally complete.

The transaction feature has not yet been committed as a final milestone at the point this documentation was created because the UI palette work was being completed around the same time.

---

# Current Routes

The frontend routing currently includes:

- `/login`
- `/invite/:token`
- `/dashboard`
- `/transactions`
- `/budgets`
- `/reports`
- `/family`
- `/settings`

Protected application pages use the dashboard layout.

The login page is outside that layout.

Some routes/pages are placeholders or are not yet fully implemented.

---

# Current Development State

The project has completed its:
- foundation,
- authentication,
- family member management,
- family invitation and membership-linking flow,
- transaction management,
- visual design system and color-palette refresh.

Phase 5 (Design System & UI Polish) is complete.

Phase 6 (Dashboard) is complete. The dashboard now presents live, selected-month family data through a protected, family-scoped `/api/dashboard` endpoint. The backend aggregates income, expenses, net savings, savings rate, daily income-versus-expense trend data, category spending, recent transactions, and member spending in PostgreSQL rather than sending all records to the browser for calculation.

The responsive dashboard includes a custom period selector, semantic summary cards, an income-versus-expenses visualization, spending by category, recent transactions using the existing transaction-item visual language, and family spending. It uses shared loading, empty, and error states. Net Savings is explicitly income minus expenses, not a bank balance.

The family invitation and role-display milestone is also complete. The frontend can accept an invitation, establish the new user's authenticated session, fetch the user's family role, and display the correct role in the sidebar. The next required step is backend-enforced role-based authorization before moving into the planned budget system.

The next work should follow `ROADMAP.md`.

Do not assume that a route existing means its functionality is complete.

---

# Important Development Philosophy

This project is being built deliberately rather than by blindly generating an entire application.

When implementing a feature:
- understand the existing code,
- make architectural decisions explicit,
- build backend/database functionality before depending on it in the UI where appropriate,
- keep business rules consistent,
- test important behavior,
- maintain a clean Git history,
- update project documentation after meaningful milestones.

The goal is not simply to make the application work; it should also demonstrate that the developer understands why the system is designed the way it is.

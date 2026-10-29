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

## 2. Authentication & Public Onboarding

Authentication is implemented using JWT and bcrypt with self-serve onboarding:
- User authentication, registration (`/signup`), and Google Sign-In support.
- Password hashing with bcrypt (cost factor 12).
- JWT token handling with a multi-layered session guard:
  - Proactive client-side token expiration check (`isTokenExpired`) prevents expired tokens from staying visually authenticated.
  - Centralized 401 response interceptor (`authFetch`) clears local credentials and dispatches an `auth:expired` event.
  - Automatic redirect to `/login?session_expired=true` displaying a prominent session expiration notice.
- Duplicate account handling on signup: if a user enters an existing email, they are automatically redirected to `/login?email=...&exists=true` with a clear explanation banner.
- Luxurious Landing Page (`/`):
  - Desktop: Features an interactive 3D solid metallic Indian Rupee (`₹`) symbol in brushed obsidian titanium with glowing rose-gold beveled edges and dynamic real-time specular glare tracking the user's cursor with spring physics inertia, dynamic contact floor shadow, and floating 3D parallax depth cards.
  - Mobile: Dedicated touch-native layout with floating 3D metallic Rupee orb, ambient orbital accents, and stacked high-contrast preview cards.
- The login and signup pages are separate from the dashboard layout.
- The application has a `ProtectedRoute` and `AuthContext`.

---

## 3. Family Management & Direct Join Codes

Family management supports both invitation links and direct 6-character shareable codes:

### Shareable Family Access Codes
- Migration `013_add_family_code.sql` adds a unique 6-character alphanumeric `code` to the `families` table (e.g. `K92X4P`, omitting ambiguous characters).
- `/onboarding` Page: When newly registered or unassigned users log in, they choose between:
  1. **Create a New Family**: Sets user as `admin`, creates a linked `family_members` row, and seeds essential starter categories (`Food & Dining`, `Housing`, `Utilities`, `Groceries`, `Healthcare`, `Transportation`, `Shopping`, `Salary`, etc.).
  2. **Join with Family Code**: User inputs the 6-character code, joins with role `member`, and is linked to their family member profile immediately.
- Admin Code Management: Admins can view their family code with a 1-click **Copy Code** button and **Regenerate Code** capability directly on the `/family` page.

### Family Invitations & Membership Roles

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

The current role display is informational, while protected backend operations now also enforce the relevant role.

### Backend authorization

Role-based authorization is implemented through the backend `requireRole()` middleware.

Current enforcement:
- family-member creation: `admin` only;
- family-member editing: `admin` only;
- family-member deactivation: `admin` only;
- family invitation creation: `admin` only;
- family-member retrieval: authenticated family users.

The middleware resolves the authenticated user's family membership and role before allowing an operation to continue.

### Role management

The Family page displays each connected member's actual role and provides admin-only role management.

Rules:
- an admin may change another connected non-admin member's role;
- an admin may assign `admin`, `member`, or `viewer`;
- an admin cannot change their own role;
- an admin cannot change another admin's role;
- members and viewers cannot change roles.

The backend endpoint enforces these restrictions; the frontend controls visibility and interaction.

The role system is no longer only informational. Transaction permissions are now role-restricted: `admin` and `member` may create, edit, and remove transactions, while `viewer` is read-only. The defined authorization combinations have been tested successfully.

### Existing-account re-invitation

The invitation flow now supports re-inviting a person whose global account already exists but who is no longer a member of the target family.

Behavior:
- invitation creation checks whether the existing account is already a member of the target family rather than rejecting every existing email;
- removing a family member deletes that user's membership for the family but does not delete the global `users` account;
- removal also clears `family_members.user_id` while keeping the inactive `family_members` row for historical transactions;
- accepting a re-invitation verifies the existing account password and reuses the existing user instead of creating a duplicate account or changing the password;
- invitation lookup and acceptance ignore inactive family-member records.

The full remove → re-add → same-email invite → accept flow was tested successfully locally and the changes were pushed to GitHub.

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

When an active family member is removed, the family-member record is retained but deactivated, its `user_id` is cleared, and the corresponding `family_memberships` row for that family is deleted. The global `users` account remains intact.

This distinction is important: removing someone from a family does not delete their global account. Because the old family-member row remains available for historical transaction references, the same account can later be attached to a new active family-member record through the invitation flow.

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

### Transaction authorization

Transaction routes are role-restricted:
- `admin`: view, create, edit, and remove;
- `member`: view, create, edit, and remove;
- `viewer`: view only.

Authorization was verified by testing the relevant role/operation combinations. Viewers can view transactions but cannot create, edit, or remove them. Viewers also cannot add, edit, or remove family members or create invitations.

Frontend action errors were separated from page-loading errors so a backend permission failure remains inside the relevant transaction modal or removal confirmation instead of incorrectly replacing the page with a data-loading error state.

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

## 8. AI Financial Assistant (AI-1)

The AI Financial Assistant (AI-1) is implemented end to end.

### Local Ollama Integration
- Provider: Local Ollama runtime running on `http://localhost:11434`.
- Model: `qwen2.5:3b`. Tested and selected specifically for rapid tool-calling performance and low latency (~0.68s tool response, ~0.21s greeting response), fitting 100% inside 6GB VRAM on consumer GPUs (RTX 4050).
- Avoids large reasoning models (such as `qwen3:8b`) that leak lengthy chain-of-thought tokens and slow responses down without adding mathematical value.
- Cost and privacy: Zero API cost, completely offline and private with financial data never leaving the local machine.

### Multi-Round Tool Calling Architecture
- Iterative tool execution loop supporting up to 4 rounds (`MAX_ROUNDS = 4`).
- Parallel tool execution using `Promise.all()`.
- Safe error recovery: tool execution errors are caught and returned in structured JSON (`{ error: ... }`) to the model instead of crashing the request or breaking the chat flow.
- Fallback text completion: on the final round, tools are omitted from the payload to ensure the model produces a concise natural language response.
- Response sanitization: automatic extraction and stripping of `<think>...</think>` tags via `cleanResponseContent` so thoughts are never exposed to the frontend.

### Reusable Financial Tool Layer
Backend tools are strictly authenticated and family-scoped using the user's JWT `family_id`. The AI has no direct PostgreSQL connection and cannot generate arbitrary SQL.
- `get_monthly_spending`: calculates total expenses and category breakdowns for a specified or current month.
- `get_category_spending`: retrieves spending for a specific category and optional date range.
- `get_family_transactions`: retrieves recent family transactions with parameterized `startDate`, `endDate`, and optional `limit` (max 20, default 10).
- `get_member_spending`: retrieves member-specific spending across date ranges. Includes automatic pronoun interception (`"I"`, `"me"`, `"my"`, `"we"`) that seamlessly redirects to family-wide spending rather than failing with "member not found".
- `get_income_summary`: aggregates family income across a specified month or date range.

### Formatting and Guardrails
- System prompt enforces plain-text answers in Indian Rupees (`₹`).
- Prohibits markdown bold (`**`), bullet points, or verbose introductory fluff in assistant responses.
- Keeps responses concise (1–2 sentences) and grounded strictly in tool output data.

### Frontend Chat Interface
- Integrated at `/ai-assistant` and added to both the collapsible desktop sidebar and the responsive mobile header.
- Clean chat message history with user and assistant bubbles matching the application palette (`#2A234F`, `#F8F7FB`, `#E8E5EF`).
- Interactive suggested prompt chips for rapid testing.
- Auto-scroll to latest message and loading state with disabled inputs during processing.
- Backend rate limiting, timeout handling, and informative error banners.

---

## 9. AI Financial Insights (AI-2)

The AI Financial Insights (AI-2) milestone is implemented end to end.

### Deterministic Financial Metrics Engine
Authoritative financial analytics are calculated entirely in PostgreSQL and TypeScript in `backend/src/services/insightsService.ts` before being passed to the AI:
- **Comparative Periods**: Dynamic comparative range resolution comparing the selected period (e.g. "October 2026") against its prior baseline (e.g. "September 2026"), supporting "This Month", "Previous Month", and "Last 3 Months".
- **Spending & Income Deltas**: Exact month-over-month (MoM) change percentage, absolute differences, and directional trends (`up`, `down`, `neutral`).
- **Net Savings & Savings Rate**: Net savings calculation (`income - expenses`) and percentage of income retained, along with baseline comparisons.
- **Category Breakdown & Spikes**: Category-level expenditure, percentage share of total family spending, and automated spike detection (defined as spending increasing by >= 20% and >= ₹500, or a new category spend >= ₹1,000).
- **Member Distribution**: Each family member's spending total, percentage share of family expenses, and identification of the `topSpender`.
- **Transaction Stats**: Transaction counts, average expense value, and the largest single expense recorded in the period.

### Natural Language Interpretation Layer
- Built in `backend/src/services/aiService.ts` via `generateFinancialInsights`.
- Validated metrics are passed to local Ollama (`qwen2.5:3b`) with strict guardrails: the model does not recalculate or invent numbers, formats all currency in `₹` (INR), and returns structured JSON with an executive summary, categorized highlights (`positive`, `warning`, `neutral`), and actionable tips.
- **Deterministic Fallback Resilience**: If Ollama is offline or the JSON output fails to parse, a deterministic fallback synthesizes a structured report directly from verified metrics, ensuring the UI never fails or displays errors to users.

### Frontend Insights UI
- Dedicated page at `/insights` (`AIInsights.tsx`).
- Navigation links added to the collapsible desktop sidebar and responsive mobile drawer.
- Reciprocal navigation between Dashboard, AI Assistant, and AI Insights.
- Visual elements:
  - Executive AI Summary card with gradient accent border, sparkle badge, and timestamp.
  - Four key metric cards (Total Expenses, Net Savings, Savings Rate, Top Category) with delta badges.
  - Categorized highlight cards with semantic styling (emerald for favorable trends, amber for spikes/alerts, blue/neutral for general insights).
  - Category shifts and spike badges.
  - Member spending distribution progress bars and largest single expense card.
  - AI actionable recommendation cards.
  - Reusable `AnimatedDropdown` for period switching and a manual "Refresh" button.
  - Shared loading, empty, and error states using `ContentState`.

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
- `/ai-assistant`
- `/insights`

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
- visual design system and color-palette refresh,
- AI Financial Assistant (AI-1: local Ollama tool calling, multi-round execution, chat UI),
- AI Financial Insights (AI-2: deterministic comparative metrics, AI interpretation, spikes detection, dedicated insights UI),
- AI Monthly Financial Summary (AI-3: specific month selector, YYYY-MM support, lazy-loaded AI narrative summary card on dashboard),
- AI Anomaly Detection (AI-4: multi-rule deterministic anomaly detection engine, AI natural-language synthesis, integrated Anomaly Radar in AI Insights),
- AI Family Spending Insights (AI-5: member category affinity, transaction counts, trend changes, concentration classification, and evolved Family Dynamics card),
- AI Dashboard / Ask About My Finances (AI-6: interactive Dashboard intelligence hub, contextual period queries, user-scoped 2-hour inactivity chat persistence, and seamless continuation into AI Assistant).

Phase 5 (Design System & UI Polish) is complete.

Phase 6 (Dashboard) is complete. The dashboard now presents live, selected-month family data through a protected, family-scoped `/api/dashboard` endpoint. The backend aggregates income, expenses, net savings, savings rate, daily income-versus-expense trend data, category spending, recent transactions, and member spending in PostgreSQL rather than sending all records to the browser for calculation.

The responsive dashboard includes a custom period selector (including the last 6 calendar months in YYYY-MM format), semantic summary cards, an income-versus-expenses visualization, spending by category, recent transactions using the existing transaction-item visual language, family spending, and a lazy-loaded AI monthly financial narrative. It uses shared loading, empty, and error states. Net Savings is explicitly income minus expenses, not a bank balance.

Phase 8, Milestones AI-1 through AI-6 are complete:
- **AI-1 (AI Financial Assistant)**: provides rapid, family-scoped tool calling over local Ollama (`qwen2.5:3b`) in `/ai-assistant`.
- **AI-2 (AI Financial Insights)**: calculates authoritative comparative metrics (expenses, net savings, savings rates, category spikes, and member distribution) in PostgreSQL and TypeScript, interpreting them into concise executive summaries, categorized highlights, and actionable recommendations at `/insights`.
- **AI-3 (AI Monthly Financial Summary)**: introduces specific calendar month selection and a non-blocking lazy-loaded AI monthly narrative card on the Dashboard.
- **AI-4 (AI Anomaly Detection)**: mathematically detects outlier transactions (relative to 90-day category baseline), same-day category velocity spikes, category surges (+100% and >= ₹1,500), and new category incursions directly in the backend, pairs them with AI plain-English synthesis (and deterministic fallbacks), and displays them in a dedicated Anomaly Radar section in `/insights`.
- **AI-5 (AI Family Spending Insights)**: calculates member-level category affinities, transaction counts, and month-over-month shifts, pairs them with spending concentration indicators (`balanced`, `concentrated`, `single_driver`) and local AI dynamic observations, and evolves the `/insights` page layout into a balanced 50/50 two-column presentation.
- **AI-6 (AI Dashboard / Ask About My Finances)**: evolves the Dashboard monthly summary card into a unified intelligence hub with dynamic inquiry chips and contextual questions for the active period, backed by a 2-hour inactivity TTL user-scoped `localStorage` store and seamless handoff into `/ai-assistant`.

The family invitation, membership-role, and backend authorization milestone is complete. The frontend can accept an invitation, establish the user's authenticated session, fetch the user's family role, display the correct role in the sidebar, display member roles on the Family page, and manage eligible member roles as an admin. The invitation flow also supports existing-account re-invitation after family removal, including existing-password verification and reuse of the global account.

Backend authorization uses `requireRole()` to enforce admin-only family-member creation, editing, deactivation, and invitation creation. Transaction routes enforce the defined role permissions: `admin` and `member` can create, edit, and deactivate transactions, while `viewer` is read-only. Family-member retrieval and transaction viewing remain available to authenticated family users.

Role-management restrictions are enforced by the backend: admins cannot change their own role or another admin's role, while eligible non-admin roles can be changed by an admin. The defined authorization combinations were tested successfully.

The transaction UI also handles authorization failures in the relevant action modal/confirmation UI instead of treating them as page-loading failures.

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


---

# AI Integration — Progress & Direction

AI is a dedicated development phase before Budget Management, implemented incrementally one milestone at a time. Milestones AI-1 through AI-5 are complete.

The project implements the following capabilities:

- **AI-1 — AI Financial Assistant (COMPLETE):** natural-language financial questions using local Ollama (`qwen2.5:3b`) and backend tool/function calling.
- **AI-2 — AI Financial Insights (COMPLETE):** deterministic backend analytics interpreted and explained by the AI.
- **AI-3 — AI Monthly Financial Summary (COMPLETE):** structured monthly financial data turned into a concise family summary on the dashboard.
- **AI-4 — AI Anomaly Detection (COMPLETE):** backend/statistical detection of unusual activity (outliers, velocity spikes, surges, new categories) followed by AI explanation, integrated into AI Insights.
- **AI-5 — AI Family Spending Insights (COMPLETE):** member category affinity, transaction counts, trend changes, concentration classification, and evolved Family Dynamics card.
- **AI-6 — AI Dashboard / Ask About My Finances (COMPLETE):** an integrated dashboard intelligence hub connecting the monthly narrative with contextual inquiries and 2-hour persisted chat continuity.
- **AI-7 — AI Budget Recommendations (COMPLETE):** advisory category allocations and monthly strategy based on 3-6 month historical spending baselines, with interactive review and 1-click batch application.
- **AI-8 — AI Budget Risk Detection (COMPLETE):** deterministic spending velocity analysis, projected month-end overspending warnings, safe daily spending caps, and proactive LLM advice via the interactive AI Budget Risk Radar.

Transaction categorization and transaction-description/merchant analysis are intentionally outside the current AI scope.

## AI Architecture

The active flow is:

`Frontend -> Backend AI Service -> Local Ollama (qwen2.5:3b) -> explicit financial tools -> existing backend services/PostgreSQL -> structured validated result -> AI response -> Frontend`

The backend remains the source of truth for financial calculations. The AI interprets and explains validated data rather than independently producing authoritative totals. The model has no direct access to PostgreSQL and never executes arbitrary SQL.

The active reusable tool and analytics layer currently includes:
- `get_monthly_spending()`
- `get_category_spending()`
- `get_family_transactions()`
- `get_member_spending()`
- `get_member_income()`
- `get_family_members_spending()`
- `get_family_members_income()`
- `get_income_summary()` & `get_income_by_date_range()`
- `calculateDeterministicMetrics()` & `generateFinancialInsights()`
- Multi-rule anomaly detection engine (outliers with 90-day baseline, velocity spikes, surges, new category incursions)
- Member spending dynamics engine (category affinities, member transaction counts, period-over-period shift tracking, family concentration classification)
- Zero-tool hallucination interception & follow-up fallback grounding for conversational assistant turns
- User-scoped 2-hour inactivity TTL chat persistence & Dashboard-to-Assistant conversational handoff

All tools and insight queries are authenticated and strictly family-scoped via JWT. Model interactions run fully locally via Ollama with zero external API calls or token fees. Financial numbers are formatted in ₹ (INR) without markdown bolding or list syntax.

---

# Phase 9 — Budget Management (COMPLETE)

Budget Management is fully implemented across the stack:
- **Database**: PostgreSQL `budgets` table tracking `family_id`, `category_id`, `amount`, `month`, and `year` with strict uniqueness constraints and positive amount checks.
- **Backend Service & Aggregation**: `getBudgetsWithSpending` performs authoritative SQL joins with `transactions` in the calendar month to compute actual spending, remaining buffers, percentage progress, and semantic tiers (`safe`, `warning`, `overbudget`).
- **Unbudgeted Spending Tracking**: Transparently computes expenses in categories without an active budget target so the family has a complete picture of total monthly expenses.
- **REST Endpoints**: Authenticated `/api/budgets` with role permissions (`admin` and `member` can create/edit/delete/copy; `viewer` is read-only).
- **1-Click Copy**: `POST /api/budgets/copy-previous` allows duplicating last month's budget limits into the current month.
- **Frontend Page (`/budgets`)**: Interactive month navigation (`<`, `>`, `This Month`), 4 summary KPI cards, monthly health progress bar, category cards with progress bars and badges, unbudgeted expenses section with quick-budget buttons, and animated Add/Edit/Delete modals.
- **Dashboard Integration**: `DashboardBudgetWidget` provides high-level budget visibility directly on `/dashboard` with immediate attention tags and direct navigation to `/budgets`.
- **AI Tool Grounding**: Added `get_budget_status` to Ollama tools and executor, allowing the AI assistant and dashboard card to answer questions about budget limits and progress deterministically.

# Phase 10 — Settings & Workspace Preferences (COMPLETE)

Settings is fully implemented as a centralized administration, personalization, and security hub (`/settings`), replacing the last placeholder in the application:
- **Navigation Cleanup**: The redundant `/reports` section was removed from both desktop sidebar and mobile navigation drawer, as the Dashboard and AI Insights already provide all reporting and analytics. `/reports` routes are safely redirected to `/insights`.
- **Role-Based Tab & Settings Visibility**:
  - The **Family Workspace** tab is strictly visible only to `admin` users.
  - The **Custom Categories** tab is visible only to `admin` and `member` users, and hidden completely for `viewer` users.
  - Active tab fallbacks ensure non-authorized roles are automatically redirected to `Profile & Security` if attempting to view unauthorized tabs.
- **Privacy-First Email Masking**:
  - Account email address is masked by default on the Profile & Security screen (e.g. `jo••••••@••••••.com`).
  - Users can click **Reveal Full Email**, requiring verification of their account password via `POST /api/auth/verify-password` before displaying the full email for the session, with a 1-click **Hide Email** toggle to re-mask.
- **Password Security Cooldown**:
  - Migration `014_add_user_security_and_2fa.sql` adds `password_changed_at` to the `users` table.
  - Password updates enforce an active security cooldown (1 hour / configurable) to prevent automated credential churning, displaying the exact remaining minutes in case of early re-attempts and showing the timestamp of the last password change.
- **Two-Factor Authentication (TOTP 2FA)**:
  - Standard RFC 6238 time-based one-time password (TOTP) implementation in `backend/src/utils/totp.ts` with zero external dependencies using Node.js `crypto` (Base32 encoding/decoding and HMAC-SHA1).
  - Works with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords, and 1Password.
  - Settings allows 2FA activation with a scannable branded QR code (matching the `#2A234F` palette), copyable Base32 secret key, 6-digit confirmation activation, and password-confirmed 2FA disabling.
  - Dedicated full-screen luxury login verification page at `/login/2fa` for accounts with 2FA enabled, issuing short-lived `2fa_pending` tokens before granting the full 7-day session.
- **Custom Household Categories**:
  - Support for creating custom expense and income categories with duplicate prevention per family.
  - Category deletion is protected by an active dependency guard: categories referenced by active transactions (`is_deleted = FALSE`) or active monthly budgets cannot be deleted, preserving relational integrity.
- **AI & Data Preferences**:
  - Live health check pinging local Ollama engine (`qwen2.5:3b`) via `GET /api/ai/health`.
  - 1-click button to clear persisted AI chat history.
  - 1-click RFC-4180 compliant CSV export of family transaction history (`GET /api/family/export`), with fixed column mapping for member relationships.
  - Active session security guard overview.
- **Full-Website Dark Mode & Appearance Theme**:
  - Global, comprehensive dark mode implementation with `ThemeContext` supporting `light`, `dark`, and `system` preferences persisted in `localStorage`.
  - Anti-FOUC inline script in `index.html` preventing theme flash on page load.
  - Interactive theme selection cards in Settings (`/settings`) with live mini-card mockups and active status indicator.
  - Comprehensive Tailwind v4 `@custom-variant dark` styling across all pages, modals, cards, dropdowns, inputs, and semantic status elements.
  - Convenient quick-toggle button added to desktop sidebar and mobile navigation drawer user menus.

# Phase 11 — Recurring Transactions & Subscriptions (COMPLETE)

Recurring Transactions & Subscriptions is fully implemented across the stack to manage fixed household commitments (rent, utilities, tuition, EMIs) and recurring subscriptions (Netflix, Spotify, gym):
- **Database Architecture**:
  - Migration `015_create_recurring_transactions.sql` created the `recurring_transactions` table with constraints for amount (`positive_recurring_amount`), type (`valid_recurring_type`), cadence (`valid_recurring_frequency`: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`), and lifecycle status (`valid_recurring_status`: `active`, `paused`, `completed`).
  - Added `recurring_transaction_id` to `transactions` table with `REFERENCES recurring_transactions(id) ON DELETE SET NULL`, ensuring historical transactions generated by a recurring schedule are permanently preserved even if the schedule is deleted.
- **Backend Service & Calculation Engine (`recurringService.ts`)**:
  - `calculateNextOccurrence`: Deterministic date arithmetic handling cadences and calendar month-end rollovers (e.g. Jan 31 -> Feb 28/29).
  - `normalizeToMonthly`: Annualized monthly spend calculation for accurate household burn rate across varying frequencies (`daily` * 30.416, `weekly` * 4.333, `quarterly` / 3, `yearly` / 12).
  - `computeInitialNextDue`: Automatically advances past start dates to the next active upcoming due date.
  - `recordSingleRecurringNow`: 1-click execution that immediately records a transaction into `transactions` and rolls `next_due_date` forward to the subsequent cycle.
  - `processDueRecurringTransactions`: Batch execution engine utilizing `FOR UPDATE` row locks and duplicate detection (`WHERE recurring_transaction_id = $1 AND transaction_date = $2`) to safely record all due bills without duplicates.
- **REST Endpoints (`/api/recurring`)**:
  - Protected by `authMiddleware` and `requireRole("admin", "member")` for modifications; `viewer` users have read-only access.
  - Endpoints support filtering by `status`, `type`, and `isSubscription`, plus pause/resume toggling and manual recording.
- **AI Tool Grounding**:
  - Tool definition `get_upcoming_bills` registered in `tools.ts` and grounded in `toolExecutor.ts`.
  - Enables local Ollama AI assistant (`qwen2.5:3b`) to answer natural language queries about upcoming bills, due dates, countdowns, and committed expenses in ₹ (INR).
- **Frontend Page (`/recurring`) & Navigation**:
  - 4 Summary KPI cards: Committed Expenses/mo, Active Subscriptions count & cost, Next Due Bill countdown, and Recurring Income/mo.
  - Urgent Due Radar banner: Highlights bills due in ≤ 7 days or overdue with 1-click "Record" buttons.
  - Filter tabs (`All`, `Subscriptions`, `Household Bills`, `Recurring Income`, `Paused`) and live title search.
  - Interactive item cards with frequency tags, status badges, member chips, and action menus.
  - Add/Edit recurring commitment modal with custom animated dropdowns, category and member selection, and subscription toggles.
  - Desktop sidebar and mobile navigation drawer updated with "Recurring & Bills" link and `CalendarClock` icon.

---

# Bank Statement Ingestion & Smart Auto-Categorization (COMPLETE)

Bank Statement Ingestion provides automated, high-volume transaction extraction and self-learning categorization across CSV, Excel (`.xlsx`, `.xls`), and PDF formats:
- **Multi-Format Ingestion**:
  - In-memory parsing via `multer` (no temporary disk files).
  - Handles CSV, Excel spreadsheets (`.xlsx` and `.xls` via `xlsx`), and official bank statement PDFs (via `pdfjs-dist`).
- **Smart Encryption & Password-Protection Detection**:
  - Automatically tests any file for encryption before prompting the user.
  - If unprotected, parses immediately with zero prompts.
  - If password-encrypted, cleanly catches `PasswordException` or spreadsheet lock, and prompts the user with an in-app password dialog containing common bank password hints (PAN, DOB, account number).
- **Extraction & Normalization Engine (`statementParserService.ts`)**:
  - Cleans raw bank narrations (UPI prefixes, POS terminal codes, NEFT/IMPS tokens, VPA handles) into clean merchant titles.
  - Normalizes multiple date formats (`DD/MM/YYYY`, `DD-Mon-YYYY`, `YYYY-MM-DD`, Excel date serials).
  - Robust debit/credit and withdrawal/deposit amount detection.
- **Deduplication & Auto-Categorization Engine (`statementCategorizerService.ts`)**:
  - Checks against existing active family transactions in PostgreSQL to detect and flag duplicates with an amber badge (`Duplicate (will skip)`).
  - 3-tier categorization pipeline:
    1. **Family Learned History**: Matches against `merchant_category_mappings` table.
    2. **Built-in Brand Catalog**: Matches 120+ Indian and global merchant signatures (Swiggy, Zomato, Blinkit, Uber, Amazon, Netflix, Apollo, etc.).
    3. **Deterministic Fallback**: Suggests appropriate family default category with confidence tagging (`learned`, `rule`, `default`).
  - `merchant_category_mappings` table (Migration `016`) remembers the family's adjustments for future imports.
- **Interactive Staging Modal (`StatementImportModal.tsx`)**:
  - File dropzone with format badges and family member selection.
  - Staging review table with summary badges (Total, Ready to Import, Duplicates Skipped, Total Expenses).
  - Checkbox selection toggles, clean merchant title editing, and pre-selected category dropdowns.
  - 1-click batch commit endpoint (`POST /api/transactions/import/commit`).

# Phase 12 — Notifications & Financial Alerts (COMPLETE)

The application features a proactive, automated financial alert engine and an in-app Notification Center:
- **Database Architecture**:
  - Migration `017_create_notifications.sql` created the `notifications` table scoped by `family_id` with foreign key cascades, `type` (`budget_warning`, `budget_exceeded`, `bill_due_soon`, `bill_overdue`, `anomaly`, `system`), `severity` (`info`, `warning`, `critical`), `title`, `message`, `link`, `metadata` (JSONB), `is_read`, `read_at`, and `created_at`.
  - Composite indexes on `(family_id, is_read)`, `(family_id, created_at DESC)`, and `(type, family_id)`.
- **Automated Financial Alert Engine (`notificationService.ts`)**:
  - `syncFinancialAlerts(familyId)`: Evaluates live family finances and generates proactive alerts:
    - **Budget Warnings**: Triggers warning notification when category expenses reach ≥ 80% of limit with remaining balance.
    - **Budget Exceeded**: Triggers critical notification when category expenses exceed 100% of planned limit with exact percentage and overspend figures.
    - **Upcoming Bills**: Triggers warning reminder for recurring commitments due today or within 1–3 days.
    - **Overdue Bills**: Triggers critical overdue alert for past due unpaid bills with days overdue.
  - **Smart Cycle Deduplication Guard**: Uses metadata queries (`budgetId`, `month`, `year` or `recurringId`, `dueDate`) to prevent duplicate unread notifications from being generated across consecutive sync runs. Supersedes earlier warnings when budgets become exceeded or bills become overdue.
- **REST Endpoints (`/api/notifications`)**:
  - `GET /api/notifications`: Triggers alert evaluation and returns notifications with live `unreadCount` and query filters (`unreadOnly`, `type: 'budget' | 'bill' | 'all'`).
  - `PUT /api/notifications/:id/read`: Marks an individual alert as read.
  - `POST /api/notifications/read-all`: Marks all unread alerts for the family as read.
  - `DELETE /api/notifications/:id`: Dismisses a single notification.
  - `DELETE /api/notifications`: Clears notifications (supports `onlyRead=true`).
  - Protected by `authMiddleware` and `requireRole("admin", "member", "viewer")`.
- **Global Reactive State (`NotificationContext.tsx`)**:
  - Supplies `unreadCount`, `notifications`, `isLoading`, and `isOpen` to the application.
  - Periodic background polling (every 90s) and automatic refresh when the browser tab regains focus.
  - Optimistic updates for immediate UI responsiveness without waiting for network round-trips.
- **Frontend UI & Notification Center Drawer**:
  - `NotificationBell`: Dynamic bell icon with blush-pink/rose unread badge counter and pulsing glow ring. Integrated into both the collapsible desktop sidebar and sticky `MobileHeader`.
  - `NotificationDrawer`: Slide-over panel with smooth right-entry animation, backdrop blur, and ESC key listener.
  - Filter tabs: `All`, `Unread`, `Budgets`, `Bills` with dynamic count badges.
  - Action controls: "Mark all read", "Clear read alerts", and individual check/trash actions on card hover.
  - Direct deep linking: Clicking a budget or bill alert automatically marks it as read, closes the drawer, and navigates to `/budgets` or `/recurring`.

---

# Phase 13 — Advanced Data Export & Reports (COMPLETE)

Advanced reporting, multi-format financial export, and official household statements are fully implemented:
- **Multi-Format Export Engine (`reportService.ts`)**:
  - **Formatted PDF Statement (`format=pdf`)**: Generates an official, executive household financial statement in vector PDF using `pdfkit`. Includes branded `#2A234F` banner, family metadata, 3-column KPI overview (Total Income, Total Expenses, Net Savings + Savings Rate in ₹ INR), category spending distribution table, and detailed transaction ledger with auto-pagination and confidential footer.
  - **Multi-Sheet Excel Workbook (`format=xlsx`)**: Generates a formatted spreadsheet using `xlsx` with two dedicated sheets:
    1. *Executive Summary*: Family header, date scope, metric KPIs, Category Breakdown table, and Member Contribution table.
    2. *All Transactions*: Comprehensive tabular data with auto-fitted column widths and numeric amounts.
  - **RFC-4180 CSV Export (`format=csv`)**: Clean tabular CSV export prefixed with UTF-8 BOM (`\uFEFF`) to preserve special characters and currency symbols across Microsoft Excel and Google Sheets.
- **Granular Filter Support**:
  - Flexible date scoping: Presets (*This Month*, *Last Month*, *Last 3 Months*, *This Year*, *All Time*) or custom start/end date ranges.
  - Transaction type scoping: *All*, *Expenses Only*, or *Income Only*.
  - Category scoping: multi-category array filtering.
  - Family member scoping: multi-member array filtering.
- **REST Endpoints (`/api/reports`)**:
  - `GET /api/reports/preview`: Real-time reactive preview endpoint returning matching count, total income, total expenses, net savings, and category/member distributions.
  - `GET /api/reports/export`: Streams formatted `.pdf`, `.xlsx`, or `.csv` files with explicit MIME headers and filename attachments.
  - Accessible to all authenticated family roles (`admin`, `member`, `viewer`).
- **Interactive UI Modal (`ExportModal.tsx`)**:
  - Format selection cards with descriptive labels and icons (`FileText`, `FileSpreadsheet`, `Table`).
  - Quick-preset pills and date pickers.
  - Collapsible checklist selectors for categories and family members.
  - Live preview summary box updating dynamically as filters change.
  - Integrated into `/transactions` page header and `/settings` Data tab.

---

## Immediate Next Milestone

With all core application features and reporting milestones complete, the immediate next milestone is:
- **Phase 14 — DevOps & Production Deployment**: Containerization with Docker & Docker Compose, CI/CD with GitHub Actions, production PostgreSQL configuration, and repeatable production deployment.

---

# DevOps & Deployment — Future Phase

Deployment and DevOps are part of the project's learning goals, but they are not current implementation work. The application is still being developed locally and the DevOps phase should begin later, after the planned major application functionality is sufficiently complete.

The future DevOps phase is expected to cover:
- Docker and containerization of the frontend and backend;
- Docker Compose for local multi-service development;
- development versus production configuration;
- production environment variables and secrets;
- production PostgreSQL and migration execution;
- backend and frontend deployment;
- production frontend/backend communication and CORS;
- domain/DNS and HTTPS/TLS;
- GitHub Actions CI/CD;
- Docker image build/deployment workflow;
- health checks;
- logging and monitoring;
- database backups;
- rollback procedures;
- production troubleshooting and deployment documentation.

The cloud provider and final production architecture have not yet been selected. No production deployment should be described as completed until it is actually implemented and validated.

The intended project progression is to finish the feature roadmap, then use this application as the practical environment for learning containerization, CI/CD, deployment, and production operations.

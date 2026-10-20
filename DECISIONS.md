# DECISIONS.md

# Family Finance — Product & Architecture Decisions

This document records important decisions so future development does not accidentally contradict earlier choices.

---

# Architecture

## Full-stack separation

The project uses a separate frontend and backend.

Frontend responsibilities:
- UI
- routing
- authentication state
- API service calls
- presentation-specific types/state

Backend responsibilities:
- authentication
- authorization
- validation
- business logic
- database access
- API responses

Do not move business logic into the frontend simply to make a feature easier.

---

# Authentication

## JWT

JWT is used for authentication.

The frontend maintains authentication state and stores the token/user state in localStorage.

Protected frontend routes are required for authenticated application pages.

## Passwords

Passwords are hashed using bcrypt.

Passwords must never be stored as plaintext.

---


# Family Invitations & Roles

## Invitation model

Family invitations are represented by a dedicated `family_invitations` table. Each invitation belongs to a family and family-member record and contains: 
- the invited email,
- a cryptographically secure random token,
- an expiry time,
- acceptance state,
- creation time.

Invitation tokens are identifiers for pending invitations. They are not JWTs and are not the JWT signing secret. Tokens are generated using secure random bytes and invitations currently expire after 48 hours.

An accepted invitation either creates a new user account or reuses an existing global account. New accounts are linked to the existing family-member record and receive a `family_memberships` row with the `member` role. Existing accounts must authenticate by providing their existing password; their password is not replaced. In both cases, the active family-member record is linked to the user, a `family_memberships` row is created, and the invitation is marked as accepted. Acceptance is performed transactionally so the account/member/membership state cannot be partially committed.

An existing global account may be invited again after being removed from a family. Invitation creation rejects the email only when the account is already a member of the target family. A family member's global `users` account is never deleted as part of family removal.

Family-member removal preserves the `family_members` row for historical transaction relationships, sets it inactive, clears its `user_id`, and deletes that user's `family_memberships` row for the family. This permits the same account to be linked to a new active family-member record during a later invitation.

## Family roles

Family membership roles currently use: `admin`, `member`, and `viewer`. The current user's role is exposed through the authenticated `GET /api/family/me` endpoint and loaded into frontend authentication state.

Role labels shown in the UI are derived from the actual membership role rather than being hardcoded. Role display is not considered authorization; backend authorization must enforce permissions for protected operations.

## Authorization implementation

Backend role-based authorization is now implemented for the family-management operations that have defined admin-only permissions.

The backend defines the family roles:
- `admin`
- `member`
- `viewer`

A reusable `requireRole()` middleware checks the authenticated user's family membership role before protected operations are executed.

Current enforced permissions:
- authenticated users may view family members;
- only `admin` users may create family members;
- only `admin` users may edit family members;
- only `admin` users may deactivate family members;
- only `admin` users may create family invitations.

The frontend may reflect these permissions in the UI, but backend checks are the actual security boundary.

Transaction permissions are defined as:
- `admin`: may view, create, edit, and deactivate transactions;
- `member`: may view, create, edit, and deactivate transactions;
- `viewer`: may view transactions only.

Family-management permissions are defined as:
- all authenticated family roles may view family members;
- only `admin` may create, edit, or deactivate family members;
- only `admin` may create invitations.

Role changes are admin-only:
- an admin may change another connected non-admin member's role;
- an admin may assign `admin`, `member`, or `viewer`;
- an admin may not change their own role;
- an admin may not change another admin's role;
- members and viewers cannot change roles.

These permissions are enforced by the backend rather than relying on frontend visibility. The defined authorization combinations have been tested successfully.

## Authorization Error Handling

Permission failures from protected operations should be shown in the relevant action UI rather than being treated as page data-loading failures. Transaction add/edit/remove authorization errors remain inside their respective modal or confirmation UI, while page-level loading errors are reserved for failures while loading page data.

# Deletion Strategy

## Family members

Family members are soft-deactivated.

Reason:
Historical transactions may reference family members. Hard deletion could damage historical financial records or relationships.

The family-member table therefore has:

`is_active BOOLEAN NOT NULL DEFAULT TRUE`

Normal active-member queries filter inactive members out.

## Transactions

Transactions are soft-deleted.

The transactions table contains:

`is_deleted BOOLEAN NOT NULL DEFAULT FALSE`

Normal transaction retrieval excludes deleted transactions.

Reason:
Financial records should remain historically recoverable at the data level even when they are removed from the user's normal view.

---

# Transaction Model

Transactions use:

`type = income | expense`

The amount itself remains positive.

The type determines whether the transaction contributes to income or expenses.

This avoids storing negative amounts for expenses while keeping the model simple.

---

# Categories

Categories are associated with transaction type.

Examples:

Expense:
- Food
- Shopping
- Bills

Income:
- Salary
- Freelance
- Business

This keeps the category system reusable instead of creating completely separate category systems.

---

# Transaction Dates

A transaction has a user-selectable transaction date.

The UI defaults new transactions to today's date.

The date should not be silently replaced with the creation timestamp because users may enter historical transactions.

---

# UI Design

## Brand palette

Primary:

`#2A234F`

Primary hover:

`#1F1A3B`

Accent:

`#FFB3C3`

Accent hover:

`#FF9FB4`

Page background:

`#F8F7FB`

Card:

`#FFFFFF`

Main text:

`#2A234F`

Secondary text:

`#77738A`

Borders:

`#E8E5EF`

## Palette usage

Dark blue is the main brand/action color.

Blush pink is an accent rather than the dominant surface color.

Neutral backgrounds should remain the majority of the interface.

The palette is applied consistently across the current application pages, shared navigation, cards, forms, and chart surfaces. Future pages should use these same roles rather than reintroducing the previous violet/indigo/slate palette.

Semantic colors remain separate:
- emerald for income/success,
- rose/red for destructive actions and expense semantics where appropriate.

Do not convert semantic status colors into pink/blue merely for palette consistency.

---

# Typography

The selected primary font is:

**Plus Jakarta Sans**

Do not replace it globally without an intentional design decision.

---

# Dropdowns

The project uses a custom `AnimatedDropdown`.

Reasons:
- consistent styling,
- animated opening/closing,
- better control over placement,
- scrollable options,
- improved visual consistency.

When a custom dropdown already exists for a feature, do not replace it with a native `<select>` unless there is a clear usability/accessibility reason.

---

# Page Layout

Whole-page desktop layouts should not use a left/right split composition. New pages should favor a single vertical flow that works as the same core composition on desktop and mobile. Internal grids may still be used for cards, metrics, or related content.

# Design Research & Interaction Quality

Before designing a new page, current inspiration should be researched from sources such as Pinterest, Dribbble, Behance, and modern SaaS/fintech products. Inspiration should be adapted to Family Finance rather than copied.

Interactive elements such as hover states, dropdowns, menus, modals, and animated overlays should be checked for stacking context, z-index, overflow, positioning, clipping, and open/closed transitions before being introduced.

# Sidebar

The desktop sidebar is collapsible.

Expanded:

`w-72`

Collapsed:

`w-20`

When collapsed:
- labels disappear,
- icons remain,
- tooltips are available,
- the logo becomes the expand control,
- user-menu behavior is simplified.

Mobile navigation remains separate.

On mobile, navigation is presented in a dedicated drawer opened from the mobile header. It should expose the same application routes as the desktop sidebar.

## Content states

Loading, empty, and error states use the shared `ContentState` component so data-backed pages present feedback consistently. New asynchronous pages should reuse it unless a different pattern is deliberately designed and documented.

---

# UI Animation

Animations should be subtle and purposeful.

Existing preferences include:
- fade,
- scale,
- translate,
- width transitions.

Avoid excessive motion or distracting effects.

A cursor-following glow was explicitly rejected for the login design.

Circular-gradient login effects were also rejected.

---

# Login Design

The login page should be a full-page layout rather than the previously explored split-screen/3D concepts.

The current direction:
- editorial/full-page composition,
- animated linear gradient,
- dark blue through purple into blush tones,
- prominent typography,
- login card/form,
- supporting content.

The gradient should not become a hard split-screen color block.

---

# Responsive Design

The application should work across:
- desktop,
- tablet,
- mobile.

Desktop sidebar behavior and mobile navigation are intentionally different.

When changing layout, preserve usable mobile behavior rather than only optimizing for desktop screenshots.

---

# Git

The repository should use meaningful milestone commits.

Examples:

`feat: build family finance application foundation`

`feat: add family member management`

`feat: add transaction management`

`style: refresh application color palette`

Avoid artificial commit spam.

A commit should represent a coherent piece of work.

---

# Development Philosophy

The application is a learning project, so implementation decisions should remain understandable.

Prefer:
- explicit code,
- clear names,
- maintainable abstractions,
- incremental changes,
- understandable database schemas,
- deliberate product decisions.

Avoid:
- unnecessary abstractions,
- premature optimization,
- unexplained dependencies,
- large rewrites,
- speculative features.

---

# Decision Change Policy

If a future feature conflicts with one of these decisions, do not silently override the decision.

Instead:
1. identify the conflict,
2. explain the tradeoff,
3. propose the change,
4. update this document if the decision is intentionally changed.

This keeps the project history coherent.


---

# AI Integration Decisions

## AI as a separate product capability

AI is being introduced as a dedicated development phase before Budget Management. It will be implemented incrementally rather than all at once.

The selected feature set is:

1. AI Financial Assistant
2. AI Financial Insights
3. AI Monthly Financial Summary
4. AI Anomaly Detection
5. AI Family Spending Insights
6. AI Dashboard / Ask About My Finances
7. AI Budget Recommendations
8. AI Budget Risk Detection

Transaction categorization and transaction-description/merchant analysis are intentionally excluded from the current AI scope.

## Backend is the financial source of truth

Authoritative financial calculations remain in the backend. The AI should not replace deterministic application logic for totals, percentages, budget calculations, or other financial values.

The intended pattern is:

`Backend calculates -> structured result -> AI interprets/explains`

For example, the backend may calculate income, expenses, change percentages, and category totals, while the AI turns those validated results into a natural-language explanation.

## AI tool/function calling

The AI Financial Assistant will use explicit backend tools/function calls to access financial information. The model will not directly query PostgreSQL. Arbitrary model-generated SQL must never be executed against the application database.

A reusable tool layer is planned around operations such as:
- `get_monthly_spending()`
- `get_category_spending()`
- `get_family_transactions()`
- `get_member_spending()`
- `get_income_summary()`
- `get_budget_status()`
- `get_spending_trends()`

Tools should call or reuse existing backend business logic where possible. Tool contracts should return structured, validated data.

## Authentication and family scoping

Every AI request must run in the authenticated user's family context. AI tools must enforce the same family/data boundaries as normal application endpoints and must never expose another family's financial information.

The frontend will never receive the AI provider API key. Provider communication belongs on the backend.

## Privacy and operational safeguards

The AI integration should:
- send only the minimum necessary financial data to the model;
- validate tool inputs and outputs;
- avoid unnecessary logging of financial data;
- use appropriate rate limiting;
- handle provider failures and timeouts cleanly;
- keep AI authorization separate from UI visibility;
- preserve the existing authentication and role-based authorization model.

## Incremental implementation

AI features will be completed and validated one at a time. AI-1 (AI Financial Assistant), AI-2 (AI Financial Insights), AI-3 (AI Monthly Financial Summary), AI-4 (AI Anomaly Detection), and AI-5 (AI Family Spending Insights) are complete. AI-6 (AI Dashboard / Ask About My Finances) is the next milestone.

## AI Family Spending Insights Architecture Decisions (AI-5)

### In-Place Evolution of Member Distribution Card & 50/50 Grid Rebalance
Rather than introducing a separate route or adding another full-width section to `/insights` (which would cause excessive vertical page scroll), AI-5 evolved the existing passive Member Distribution card:
- The previous card was a near-duplicate of the Dashboard's `FamilySpending` widget, showing only static totals and progress bars without actionable intelligence.
- Rebalanced the two-column grid from `xl:grid-cols-[1.2fr_0.8fr]` (60/40) to `lg:grid-cols-2` (50/50), providing member dynamics ample horizontal space for transaction counts, trend badges, and category affinity chips.
- Streamlined Category Shifts to the top 5 categories and moved the "Largest Single Expense" card to the bottom of the left column. This aligns vertical card heights with the right column's AI note callout.

### Deterministic Member Category Affinity & Dynamic Classification
Authoritative figures are calculated in PostgreSQL and TypeScript before invoking the AI:
1. **Category Affinity**: Aggregates each member's spending per category to identify their primary expenditure area (e.g. *"Food: 60% of member spend"*).
2. **Transaction Velocity & Shifts**: Calculates transaction count and month-over-month percentage change (`+15%` or `-8%`) with visual trend indicators.
3. **Concentration Classification**: Evaluates family distribution balance (`balanced` when multi-member spend is distributed, `concentrated` when one member drives >= 70%, or `single_driver` when only one member was active).

### AI Plain-English Synthesis & Fallback Resilience
- The model receives verified member metrics and outputs a concise `familyDynamicsNote` explaining how household members collaborated on finances.
- If Ollama is offline or returns invalid JSON, the deterministic baseline observation is used seamlessly without breaking the UI.

## AI Monthly Summary — Dashboard Integration (AI-3)

AI-3 was deliberately implemented as a dashboard enhancement rather than a separate page.

Reasoning:
- A dedicated Monthly Summary page would have duplicated data already visible on the Dashboard (income, expenses, categories, members) and AI Insights (AI-generated analysis).
- The two genuine additions — a specific month picker and a brief AI narrative — integrate naturally into the existing Dashboard without creating navigation redundancy.

What was added to the Dashboard:
- Period dropdown now includes the last 6 specific calendar months (e.g. "October 2026") in `YYYY-MM` format, in addition to aggregate periods (Last 3 Months, Last 6 Months, This Year).
- A lightweight AI narrative card appears below the stat cards. It lazy-loads after the dashboard data is ready so it never blocks the main view. While loading, it shows a pulse skeleton. On error, the card is silently omitted rather than showing an error state.
- Both the dashboard service and the insights service were updated to parse `YYYY-MM` period strings into correct PostgreSQL date ranges.

## AI Anomaly Detection Architecture Decisions (AI-4)

### Integrated UI within Financial Insights
Rather than creating an isolated `/anomalies` route that would increase navigation clutter, Anomaly Detection was integrated directly into the AI Insights view (`/insights`):
- The Insights page is already the designated hub for deep-dive analytical financial intelligence.
- The Anomaly Radar section sits directly on the page, providing an at-a-glance view of unexpected variance and velocity spikes.
- When no anomalies exist, a reassuring "All Spending Within Normal Range" banner provides positive feedback without alarming the user.

### Deterministic Anomaly Engine & Multi-Rule Taxonomy
To ensure 100% mathematical accuracy without hallucinations:
1. **Outlier Transactions**: Compares single transactions against a 90-day category historical average/standard deviation. Transactions >= 2.5x category average (or 3x family average if no category baseline exists) with a minimum value of ₹1,000 are flagged as variance outliers.
2. **Velocity Spikes**: Detects transaction clustering (>= 3 expenses in the same category on the exact same date totaling >= ₹1,000).
3. **Category Surges**: Flags categories where spend in the current period has doubled (+100%) and increased by at least ₹1,500 over the comparison baseline.
4. **New Category Incursions**: Detects major expenses (>= ₹2,000) in categories that had zero activity in prior comparison periods or historical baselines.

### AI Natural-Language Synthesis & Fallback Resilience
- Validated anomaly objects are fed into the LLM prompt. Ollama returns plain-English notes tailored to each anomaly explaining why it was flagged and what to verify.
- Built-in deterministic fallback ensures that if Ollama is offline or returns invalid JSON, clear, pre-crafted explanations are displayed instantly without errors.


## Local Ollama & Model Architecture Decisions (AI-1)

### Choice of Local Ollama over External Cloud APIs
The project adopted local Ollama (`http://localhost:11434`) rather than commercial APIs (OpenAI/Anthropic):
- **Cost**: Eliminates ongoing API token charges.
- **Privacy**: Multi-tenant family financial records never leave the local environment.
- **Independence**: Operates reliably without internet connectivity or external rate quotas.

### Choice of Small Instruct Model (`qwen2.5:3b`) over Reasoning Models
Initial testing with `qwen3:8b` and other reasoning models showed severe performance bottlenecks:
- Reasoning models spent 20–90 seconds generating 500+ hidden chain-of-thought tokens debating mathematical arithmetic before answering.
- Because backend tools already compute authoritative financial figures directly in PostgreSQL, internal reasoning math by the model is redundant.
- `qwen2.5:3b` (1.9 GB) fits 100% inside 6GB VRAM on consumer GPUs (e.g. RTX 4050), responds in ~0.21s for text and ~0.68s for tool calls, and excels at structured function calling.

### Multi-Round Tool Calling Agentic Loop
The backend AI service was architected with a multi-round agentic loop (`MAX_ROUNDS = 4`):
- Supports multi-step reasoning where answering one question requires data from multiple tools or periods.
- Multiple tool calls within a single round are dispatched concurrently using `Promise.all()`.
- Safe error recovery: tool execution errors are captured and returned in JSON format (`{ error: ... }`) back to the model, allowing it to recover or provide a clarifying answer rather than terminating the HTTP request with a 500 status.
- The final round omits the `tools` array from the payload to force a text conclusion.

### Prompt & Formatting Guardrails
- Assistant responses are constrained to plain text in Indian Rupees (`₹`), strictly forbidding markdown asterisks (`**`) or bullet lists.
- A regex sanitization pass (`cleanResponseContent`) strips any leaked `<think>...</think>` tags to preserve clean conversational output.

### Zero-Tool Hallucination Interception & Contextual Follow-Up Grounding
Testing conversational multi-turn flows revealed two failure modes in small local models (`qwen2.5:3b`):
1. **Lazy Conversational Continuation**: When asked short follow-ups (e.g. *"what about income?"*) or verification questions (*"are you sure?"*), the model would sometimes skip tool calls and generate plausible-sounding text mirroring the previous turn (fabricating numbers like ₹15,000 or ₹20,000).
2. **Mental Math on Raw Transactions**: When asked for family member breakdowns without a dedicated member aggregation tool, the model fell back to fetching raw transactions via `get_family_transactions` and attempted manual arithmetic, mixing up months and fabricating member totals.

To permanently prevent financial hallucinations:
- **Dedicated Aggregation Tools**: Implemented `get_family_members_spending` and `get_family_members_income` in PostgreSQL, performing authoritative SQL `GROUP BY` sums across all active members. Explicit negative constraints in tool descriptions prohibit using raw transaction retrieval for computing totals.
- **Resilient Default Ranges**: Tool execution automatically defaults missing or omitted date arguments to the current calendar month rather than aborting with validation errors on elliptical follow-up questions.
- **Zero-Tool Hallucination Interceptor**: If the model attempts to generate monetary figures in round 0 without having executed any tool call, the backend intercepts the response, discards the hallucinated draft text completely, and injects a high-priority system reminder forcing an authoritative tool query before answering.

## AI Financial Insights Architecture Decisions (AI-2)

### Backend Deterministic Calculation Engine
Financial mathematics (income, expenses, month-over-month percentage deltas, net savings, savings rate, category spikes, and member distribution) are strictly calculated by the backend in PostgreSQL and TypeScript (`insightsService.ts`):
- Eliminates any risk of LLM hallucinations or computational rounding errors.
- Pre-calculates exact comparative values between the selected period and its prior baseline (e.g. "October 2026" vs "September 2026").
- Spikes are mathematically detected when a category increases by >= 20% and >= ₹500 (or new category >= ₹1,000).

### AI Interpretation via Structured JSON & Fallback Resilience
Validated metrics are supplied directly to `qwen2.5:3b` with instructions to interpret the findings into:
1. Executive summary (1–2 sentences).
2. Key highlights categorized by semantic type (`positive` for favorable trends, `warning` for spikes/alerts, and `neutral` for general insights).
3. Actionable recommendations (1–2 practical tips).

To guarantee robust availability:
- If Ollama is unavailable, times out, or returns invalid JSON, the backend automatically triggers `generateDeterministicFallbackInsights`.
- The fallback constructs a coherent structured report directly from verified PostgreSQL numbers. The UI never errors or breaks when the local model is offline.

### Dedicated UI Placement with Reciprocal Navigation
Per user preference, AI Financial Insights has a dedicated view at `/insights` (`AIInsights.tsx`):
- Added to the desktop collapsible sidebar (`Sidebar.tsx`) and mobile drawer (`MobileHeader.tsx`).
- Reciprocal navigation provided on both the Dashboard (`Dashboard.tsx`) and AI Assistant (`AIAssistant.tsx`) for fluid discovery across the application.
- Uses a single vertical page flow with metric cards, executive summary, categorized highlight cards, category shift badges, member distribution progress bars, and actionable tips.

## AI Dashboard & Chat Continuity Architecture Decisions (AI-6)

### Unified Dashboard Intelligence Hub
Rather than cluttering the dashboard with a separate chatbot overlay or disconnected widget, AI-6 evolves the existing monthly narrative card into a unified Dashboard Intelligence Hub:
- Displays the lazy-loaded executive monthly summary for the selected period.
- Embeds an inline "Ask About This Period" inquiry bar with contextual prompt chips (e.g. *"Who spent the most?"*, *"How much did we spend on Food?"*, *"What was our total income?"*).
- Formats queries with active period context (e.g. `[Context: Family finances for October 2026]`) so the AI evaluates the exact month the user is viewing.

### User-Scoped 2-Hour Inactivity Chat Persistence
Previously, conversational chat in `/ai-assistant` resided strictly in React component state and was wiped upon browser refresh or page navigation. To balance conversational continuity with privacy and freshness:
- Chat state is persisted in client `localStorage` scoped to the authenticated user ID (`family_finance_ai_chat_${userId}`).
- A 2-hour inactivity TTL window (`CHAT_INACTIVITY_TTL_MS = 2 * 60 * 60 * 1000`) is enforced: if the user does not interact with the assistant for 2 hours, the session automatically resets to a clean initial greeting upon next visit.
- A manual "New Chat" button in the AI Assistant header allows users to instantly reset the conversation at any time.

### Dashboard-to-Assistant Conversational Handoff
When an answer is rendered in the Dashboard intelligence card:
- A `"Continue in AI Assistant →"` button appends both the user's question and the AI's verified answer directly into the active chat session via `appendDashboardExchange()`.
- The user is navigated to `/ai-assistant` with the exchange already present in the message thread.
- Because the message history is restored and sent to Ollama, follow-up questions (such as *"What did they spend it on?"*) retain full antecedent context.

---

# Budget Management Architecture

## Discrete Monthly Budget Model (No Automatic Rollover)
The budget system is designed around discrete calendar months (`month` 1–12 and `year` >= 2000), aligning directly with PostgreSQL `transactions` timestamps and the dashboard period selector:
- Each month maintains independent planned limits per expense category.
- **No Automatic Rollover**: Unspent budget balances do not automatically compound or inflate subsequent months' limits. This prevents misleading surplus compounding and enforces deliberate monthly planning.
- **Copy from Previous Month**: A 1-click convenience endpoint (`POST /api/budgets/copy-previous`) allows families to duplicate their prior month's category limits into the current month without manual re-entry (`ON CONFLICT DO NOTHING`).

## Authoritative Database Aggregation & Unbudgeted Spending
Budget progress calculations are strictly performed in PostgreSQL and backend services:
- Actual spending is calculated via `LEFT JOIN transactions` where `type = 'expense'`, `is_deleted = FALSE`, and `transaction_date` falls in the target calendar month.
- Semantic progress tiers:
  - `safe`: Spending is under 80% of budget limit.
  - `warning`: Spending has reached or exceeded 80% of budget limit.
  - `overbudget`: Spending has exceeded 100% of the budget limit.
- **Unbudgeted Spending Tracking**: Expenses incurred in categories without a configured budget limit for that month are explicitly aggregated and surfaced, ensuring that total monthly expenses match authoritative dashboard and transaction records.

## Role Permissions for Budgets
- `viewer`: Read-only access to view budget allocations, progress bars, and alerts.
- `admin` and `member`: Authorized to create, update, delete, and copy monthly category budgets.

## AI Grounding via `get_budget_status` Tool
The backend exposes `get_budget_status` to Ollama and the AI Assistant:
- Queries `getBudgetsWithSpending` with strict family scoping and validated month/year parameters.
- Formats all output amounts authoritatively with `₹` (INR), preventing model mental arithmetic hallucinations when answering budget queries.

---

# DevOps & Deployment — Planned Direction

DevOps is a deliberate future phase of the project because the project is also intended to teach practical deployment and DevOps skills. It should not be started immediately alongside the current AI work. The intended point is after the major application features are sufficiently complete and the application has enough functionality to make production deployment meaningful.

The deployment approach should favor learning core concepts over hiding them behind a one-click platform. The planned learning sequence includes Docker, Docker Compose, production configuration, environment variables and secrets, PostgreSQL deployment and migrations, frontend/backend deployment, production CORS and communication, domain/DNS, HTTPS/TLS, GitHub Actions CI/CD, Docker image workflows, health checks, logging, monitoring, backups, rollback, and production troubleshooting.

The exact hosting provider is intentionally not fixed yet. That decision should be made when the DevOps phase begins after the application's feature roadmap has progressed.

Production architecture must preserve the project's existing separation of responsibilities: frontend presentation, backend business logic/authorization, and PostgreSQL data storage. Deployment infrastructure must not move business rules into the frontend or bypass backend authorization.

No deployment environment, cloud architecture, CI/CD pipeline, or production database should be considered implemented merely because it is documented here.

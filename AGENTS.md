# AGENTS.md

## Project Overview

Family Finance is a full-stack family income and expense management application.

It is being built as:
- a serious learning project for full-stack development, and
- a portfolio project that should demonstrate clean architecture, practical product thinking, and professional development practices.

The repository should remain understandable to a developer who joins the project later.

## Current Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- react-router-dom

### Backend
- Node.js
- Express
- TypeScript
- JWT authentication
- bcrypt password hashing

### Database
- PostgreSQL
- PostgreSQL is managed/tested through pgAdmin during development.
- Database changes are handled through SQL migration files.

## Repository Structure

The project currently contains separate frontend and backend areas.

Typical responsibilities:
- Frontend: pages, components, services, types, authentication state, routing, UI.
- Backend: Express routes/controllers/services, authentication middleware, database access, migrations.

Inspect the existing repository structure before adding or moving files.

## General Coding Rules

1. Read the existing implementation before changing it.
2. Preserve working functionality unless the task explicitly requires changing it.
3. Do not rewrite architecture just to make a change easier.
4. Prefer small, understandable changes over large refactors.
5. Do not introduce a dependency when existing project tools can solve the problem.
6. Keep TypeScript types explicit and consistent with the existing codebase.
7. Keep API contracts consistent between frontend services and backend endpoints.
8. When changing a feature, inspect related frontend, backend, database, and type definitions before making assumptions.
9. Do not silently change business rules.
10. Do not remove existing functionality because it is not currently used on a page.

## UI / Design System

The current visual direction uses:

- Primary dark blue: `#2A234F`
- Primary dark-blue hover: `#1F1A3B`
- Accent blush pink: `#FFB3C3`
- Accent hover: `#FF9FB4`
- Page background: `#F8F7FB`
- Card/background white: `#FFFFFF`
- Main text: `#2A234F`
- Secondary text: `#77738A`
- Borders: `#E8E5EF`

Use approximately:
- neutrals as the dominant visual surface,
- dark blue as the main brand/action color,
- blush pink as a controlled accent.

Keep semantic colors semantic:
- emerald/green for income/success,
- rose/red for expenses and destructive actions,
- do not replace semantic status colors with the brand palette.

The application uses Plus Jakarta Sans as its primary font.

Avoid blindly replacing every Tailwind violet/indigo/slate class. Map colors intentionally according to their role.

## UI Behavior

The project favors:
- clean modern interfaces,
- subtle transitions,
- fade/scale animations for menus and dropdowns,
- responsive layouts,
- custom dropdown components instead of native browser selects where a custom dropdown already exists.

Do not remove existing animations or responsive behavior during unrelated styling work.

Before designing a new page, research current design inspiration from sources such as Pinterest, Dribbble, Behance, and modern SaaS/fintech products. Use the research to inform the composition and interaction ideas, but adapt the ideas to Family Finance rather than copying them. Before introducing hover effects, animations, dropdowns, menus, or overlays, check their stacking, overflow, positioning, and open/closed-state behavior so they do not create clipping or overlap bugs.

Do not use a whole-page left/right split layout on desktop. Prefer a single vertical page flow that remains conceptually consistent across desktop and mobile. Internal grids for cards, statistics, or related content are allowed when they improve readability.

The desktop sidebar is collapsible:
- expanded width: `w-72`
- collapsed width: `w-20`
- labels hide while icons remain,
- the logo acts as the expand control when collapsed,
- mobile sidebar/header behavior should remain separate and responsive.

## Authentication Rules

Authentication currently uses:
- JWT
- bcrypt
- localStorage for the frontend token/user state
- protected frontend routes

The login page must not display the dashboard sidebar.

Protected pages must remain protected. Do not bypass authentication for convenience during development.

## Family Invitation Rules

Existing global accounts may be invited to a family again after they have been removed from that family.

Invitation creation should reject an email only when the corresponding account is already a member of the target family. It should not reject an account merely because a global `users` row already exists.

When an invitation is accepted:
- reuse an existing account after verifying its existing bcrypt password;
- do not overwrite the existing account password;
- create the family membership for the target family;
- link the existing `user_id` to the active `family_members` record;
- create a new account only when no account exists for the invited email.

Invitation lookup and acceptance should operate only on active family-member records.

## Authorization Rules

Role-based authorization is enforced on the backend.

Family roles are:
- `admin`
- `member`
- `viewer`

The backend uses the `requireRole()` middleware to enforce role restrictions after authentication.

Current enforced permissions:
- viewing family members requires authentication;
- creating family members requires `admin`;
- editing family members requires `admin`;
- deactivating family members requires `admin`;
- creating family invitations requires `admin`;
- viewing transactions is available to `admin`, `member`, and `viewer`;
- creating, editing, and deactivating transactions require `admin` or `member`.

Role-management rules:
- only `admin` users can change family-member roles;
- an admin may change another connected non-admin member between `admin`, `member`, and `viewer`;
- an admin cannot change their own role;
- an admin cannot change another admin's role;
- members and viewers cannot change roles.

Important:
- frontend role-based UI visibility is not a security boundary;
- protected operations must remain enforced by the backend;
- the backend is the source of truth for role authorization;
- viewer users are read-only for transactions and family-management operations;
- authorization behavior has been tested for the defined role/operation combinations.

## Data / Deletion Rules

Important business rules:

Transactions must not be hard-deleted.

Transaction removal is implemented as soft deletion so historical financial information can remain intact.

Family members are also deactivated rather than hard-deleted so historical transaction relationships are preserved.

A family member's global `users` account must not be deleted when that person is removed from a family. Removing an active linked family member also removes that user's `family_memberships` row for the family and clears `family_members.user_id`, allowing the same global account to be linked to a new family-member record later.

When working on data deletion or family membership changes, preserve these rules unless the product requirements explicitly change.

## Transaction Rules

Transactions have:
- title
- amount
- type (`income` or `expense`)
- category
- family member
- transaction date

Amounts must be positive; the transaction type determines whether the amount represents income or expense.

Categories are generalized by transaction type.

Examples:
- Expenses: Food, Shopping, Bills
- Income: Salary, Freelance, Business

The transaction UI currently supports:
- creation,
- editing,
- soft removal,
- searching,
- category filtering,
- type filtering,
- custom animated dropdowns.

## Working With Existing Files

Before editing a file:
1. Read the current file.
2. Identify what is logic versus presentation.
3. If the task is styling-only, change styling only.
4. Preserve imports and behavior unless the task requires otherwise.
5. Check related components if the change affects a shared contract.

Do not replace a whole file with an invented version when the existing file contains functionality that has not been inspected.

## Validation

After making a change:
1. Run the relevant TypeScript/build/lint checks available in the project.
2. Check for obvious runtime issues.
3. For UI work, verify the affected page and important interactions.
4. For backend/database work, verify API behavior and relevant database constraints.
5. Do not claim a feature is complete if it has not been reasonably validated.

## Git Workflow

Use meaningful commits.

Good examples:
- `feat: add transaction management`
- `feat: add family member management`
- `style: refresh application color palette`
- `feat: add budget management`

Avoid artificial commits that exist only to make the commit graph look active.

A feature should normally receive a commit after a meaningful, coherent milestone is complete.

After a meaningful, tested milestone is complete, remind the user to commit and push the work to GitHub before starting the next substantial feature. The reminder is a workflow checkpoint; do not create the commit or push unless the user explicitly asks.

Do not create commits unless the user asks or the project's workflow explicitly calls for it.

## Documentation

The project uses these documentation files:

- `AGENTS.md` — instructions for coding agents.
- `PROJECT_CONTEXT.md` — current project state and completed work.
- `ROADMAP.md` — planned development work.
- `DECISIONS.md` — important product and architecture decisions.

Keep these documents consistent with the actual repository.

When a major feature or architectural decision is completed, update the appropriate documentation rather than allowing the documentation to become stale.

## Roadmap Discipline

When asked to implement the next roadmap item:
1. Read `ROADMAP.md`.
2. Read the relevant section of `PROJECT_CONTEXT.md`.
3. Read `DECISIONS.md` for applicable constraints.
4. Inspect the current codebase.
5. Implement the feature incrementally.
6. Validate it.
7. Update documentation when the milestone is genuinely complete.

Do not implement speculative roadmap items simply because they seem useful.

## Communication

When reporting work:
- State what changed.
- Mention important files/components affected.
- Mention validation performed.
- Call out any assumptions or unresolved issues.
- Do not hide architectural changes inside a task described as a simple UI change.


## AI Integration Rules

AI is a deliberate project phase and must be implemented incrementally, one meaningful feature at a time. The project will implement the following AI capabilities, excluding transaction categorization and transaction-description/merchant analysis:

1. AI Financial Assistant
2. AI Financial Insights
3. AI Monthly Financial Summary
4. AI Anomaly Detection
5. AI Family Spending Insights
6. AI Dashboard / Ask About My Finances
7. AI Budget Recommendations
8. AI Budget Risk Detection

### AI architecture principles

- The backend remains the source of truth for financial calculations and business rules.
- The AI should interpret, explain, summarize, or reason over validated application data rather than independently calculating authoritative financial figures.
- The AI must not have direct database access.
- The AI must not generate arbitrary SQL that is executed against PostgreSQL.
- AI access to financial data must occur through explicit backend tools/function calls.
- Tool calls must execute in the authenticated user's family scope and must respect the same authorization model as the rest of the application.
- Only the minimum financial data required for a request should be sent to the model.
- AI provider API keys must remain on the backend and must never be exposed to the frontend.
- Tool inputs and outputs must be validated before being used.
- Sensitive financial data should not be unnecessarily written to logs.
- AI endpoints should have appropriate rate limiting and error handling.

The planned reusable financial tool layer may expose operations such as:
- `get_monthly_spending()`
- `get_category_spending()`
- `get_family_transactions()`
- `get_member_spending()`
- `get_income_summary()`
- `get_budget_status()`
- `get_spending_trends()`

The exact tool contracts should be designed before implementation and should reuse existing backend services/queries where appropriate rather than duplicating business logic.

### AI implementation workflow

For each AI milestone:
1. Define the user-facing capability and its boundaries.
2. Define the backend data/tools required.
3. Enforce authentication and family scoping.
4. Define structured inputs/outputs where appropriate.
5. Implement the backend AI integration.
6. Test the backend independently with Postman.
7. Add the frontend experience.
8. Validate errors, empty states, rate limits, and authorization.
9. Update project documentation after the milestone is genuinely complete.

The immediate next AI milestone is **AI-1: AI Financial Assistant**, beginning with AI provider/API selection, backend AI service structure, reusable tool definitions, authorization/family scoping, frontend chat, environment variables, failure handling, and Postman testing.

## DevOps & Deployment Rules

DevOps is a planned future phase, not current implementation work. Do not introduce deployment infrastructure prematurely just because deployment will eventually be required. The project should first complete the planned major application functionality and then enter a dedicated hands-on DevOps phase.

When the DevOps phase begins:
- learn Docker fundamentals before relying on prebuilt hosting abstractions;
- containerize the frontend and backend;
- use Docker Compose to understand the local multi-service environment;
- distinguish development configuration from production configuration;
- keep production secrets and environment variables outside source control;
- deploy PostgreSQL and run migrations as an explicit part of deployment;
- configure production frontend/backend communication and CORS deliberately;
- learn domain/DNS and HTTPS/TLS configuration;
- use GitHub Actions to build CI first, then CD;
- build and deploy versioned Docker images where appropriate;
- add health checks, logging, monitoring, backups, and rollback procedures;
- practice troubleshooting the deployed system rather than treating hosting as a black box.

The cloud provider and exact deployment architecture should be selected when this phase starts. Do not mark deployment tasks complete until they have actually been implemented and reasonably validated.

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

Transaction permissions for `member` and `viewer` have not yet been finalized. Until those permissions are deliberately defined and applied, transaction routes remain authentication-protected rather than role-restricted.

Authorization tests for the protected role/operation combinations are also still pending.

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

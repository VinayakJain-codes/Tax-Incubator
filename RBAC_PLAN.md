# Role-Based Access Control (RBAC) — Feature Plan
## Symax Governance Dashboard

> **Feature:** Three user roles — Super Admin · Admin · Viewer  
> **Stack:** Next.js 14 · Supabase · TypeScript · Tailwind CSS

---

## Role Matrix

| Action | Super Admin | Admin | Viewer |
|---|:---:|:---:|:---:|
| View all sheets & records | ✅ | ✅ | ✅ |
| Edit any record | ✅ | ✅ | ❌ |
| Insert new records | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | ✅ |
| View audit log | ✅ | ✅ | ❌ |
| Request deletion (with reason) | ✅ | ✅ | ❌ |
| Approve / Reject deletion requests | ✅ | ❌ | ❌ |
| Immediate hard delete | ✅ | ❌ | ❌ |
| View all deletion requests | ✅ | Own only | ❌ |
| Manage users & assign roles | ✅ | ❌ | ❌ |

---

## How the Delete Approval Flow Works

1. Admin clicks Delete on any record
2. A modal appears asking for a **reason** (required)
3. A deletion request is created with status **Pending**
4. Super Admin sees a **notification badge** on the bell icon and in the sidebar
5. Super Admin opens the Approvals page and reviews the request
6. Super Admin either **Approves** or **Rejects** with optional notes
7. If Approved → record is soft-deleted and the action is logged to the audit trail
8. If Rejected → request is closed, admin can see the rejection reason
9. Super Admin can also bypass this entire flow and delete immediately at any time

---

## Architecture — What Gets Built

### Database Layer

A new `user_profiles` table is created in Supabase. It stores one row per user with their email, name, and role. A database trigger fires automatically whenever a new user signs up and creates their profile with the default role of **Viewer**. The existing `deletion_requests` table (already in the schema from Phase 2) gets updated RLS policies to enforce role-based visibility. All core data tables get new RLS policies so that even if someone bypasses the UI, the database itself enforces the role rules.

### Auth & Logic Layer

A `useRole` hook is created that fetches the current user's role from the database and makes it available to any component. A `permissions` helper file holds simple true/false functions like `canEdit()`, `canDelete()`, `canApprove()` — these are the single source of truth for permission logic across the entire app.

### UI Layer

A `PermissionGate` wrapper component is built that accepts a list of allowed roles and either renders its children or renders nothing (or a fallback). This is used throughout the app to hide or show buttons, links, and sections. The `EditModal` gains a read-only mode — when a Viewer opens a record, all fields are non-editable and a "View Only" badge is shown. The `GenericTable` hides the Edit and Delete buttons for Viewers. For Admins, the Delete button is replaced with a "Request Delete" button that triggers the approval flow instead of immediately deleting.

---

## Phases

### Phase 1 — Database
- Create the `user_profiles` table with role column (values: `super_admin`, `admin`, `viewer`)
- Add a trigger that auto-creates a Viewer profile for every new signup
- Update RLS on `deletion_requests` to be role-aware
- Add RLS policies to all core data tables (entities, directors, bank accounts, etc.)

### Phase 2 — Auth & Permissions Layer
- Build the `useRole` hook
- Build the `permissions` helper file
- These two files become the foundation everything else uses

### Phase 3 — UI Gating
- Build the `PermissionGate` component
- Update `TopBar` to show the live role as a color-coded badge (orange for Super Admin, blue for Admin, gray for Viewer) and replace the hardcoded "Viewer" text
- Update `GenericTable` to show/hide Edit and Delete buttons based on role
- Update `EditModal` to render in read-only mode for Viewers

### Phase 4 — Delete Approval Workflow
- Build the `DeleteRequestModal` (reason input, submit to pending queue)
- Build the `ApprovalQueue` component (table of pending requests with Approve/Reject actions)
- Create the `/approvals` page (Super Admin only — redirects others away)
- Admin can also view their own past requests and their statuses on this page

### Phase 5 — User Management
- Create the `/admin/users` page (Super Admin only)
- Shows a table of all users with their current role
- Super Admin can change any user's role via a dropdown
- Role changes are written to `user_profiles` and logged in the audit trail
- Changing someone to Super Admin requires a confirmation step

### Phase 6 — Notifications
- Update the TopBar bell icon to show a live count of pending deletion requests (Super Admin only)
- Update the sidebar to show an Approvals link with a badge count (Super Admin only)
- Update the sidebar to show a User Management link (Super Admin only)
- Audit Log link in the sidebar is hidden for Viewers

---

## Files to Create

| File | Purpose |
|---|---|
| `schema_rbac.sql` | All DB changes — new table, trigger, RLS policies |
| `lib/useRole.ts` | Hook to get current user's role |
| `lib/permissions.ts` | Permission helper functions |
| `components/PermissionGate.tsx` | Conditional render wrapper |
| `components/DeleteRequestModal.tsx` | Admin delete request modal |
| `components/ApprovalQueue.tsx` | Super Admin approval UI |
| `app/approvals/page.tsx` | Approvals route |
| `app/admin/users/page.tsx` | User management route |

## Files to Modify

| File | What Changes |
|---|---|
| `components/GenericTable.tsx` | Role-aware Edit / Delete buttons |
| `components/EditModal.tsx` | Read-only mode for Viewers |
| `components/TopBar.tsx` | Live role badge + bell notification count |
| `components/SheetSidebar.tsx` | Conditional nav links by role |
| `app/audit-log/page.tsx` | Redirect Viewers away |
| `types/index.ts` | Add UserRole type and UserProfile interface |

---

## Implementation Order

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Each phase is independently deployable. The app stays fully functional after each phase — nothing breaks mid-implementation.

---

## Important Notes

- **First step before anything else:** Manually set your own user to `super_admin` directly in the Supabase dashboard (`user_profiles` table). Otherwise you will lock yourself out.
- **Default role on signup is Viewer** — every new user starts with zero write access until a Super Admin promotes them.
- **Two-layer security:** Permissions are enforced both in the UI (buttons hidden) and at the database level (RLS policies). A user cannot bypass the UI and call Supabase directly to write or delete data if they don't have the right role.
- **Existing data is unaffected.** All changes are purely additive.

---

*Symax Governance Dashboard · Vicinix · Vinayak Jain*

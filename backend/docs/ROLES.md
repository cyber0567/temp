# Platform Roles

Three-tier role hierarchy for access control.

## 1. Rep (User)
**Sales representative making calls**

| Permission | Description |
|------------|-------------|
| Access Rep Portal and Dialer | Use the rep portal and call dialer |
| View own compliance status | See own compliance status |
| Use AI Call Assistant | Use AI call assistant features |
| View own performance metrics | Access personal metrics only |

**Default role** for new signups.

---

## 2. Admin
**Business owner / manager**

| Permission | Description |
|------------|-------------|
| All Rep permissions | Everything a Rep can do |
| View all agents' compliance & performance | See team-wide metrics |
| Create/manage compliance rules | Define and edit compliance rules |
| Receive violation alerts | Get alerted on violations |
| Set daily goals for team | Configure goals for the organization |

**Org-scoped**: Admin has `org_role: admin` in `organization_members` for their business.

---

## 3. Super Admin
**Platform owner (client)**

| Permission | Description |
|------------|-------------|
| All Admin permissions | Everything an Admin can do |
| View all businesses' data | Cross-org visibility |
| Manage all users across platform | Update any user's platform role |
| Access platform-wide analytics | System-wide analytics |
| System configuration | Platform settings |

**Platform-wide**: No org restriction. Use `requirePlatformRole('super_admin')` middleware.

---

## API

- `GET /me` – Returns `user.platformRole` (rep | admin | super_admin)
- `PATCH /admin/users/:userId/platform-role` – Set role (super_admin only)
- `GET /admin/users` – List all users (super_admin only)

## Middleware

```ts
requirePlatformRole('admin')      // Admin or Super Admin
requirePlatformRole('super_admin') // Super Admin only
```

Roles are hierarchical: `rep < admin < super_admin`. A higher role satisfies checks for lower roles.

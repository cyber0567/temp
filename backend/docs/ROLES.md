# User Roles and Permissions

Three-tier role hierarchy for access control.

---

## User (Rep)

**Sales representative making calls**

- Access Rep Portal and Dialer
- View own compliance status
- Use AI Call Assistant
- View own performance metrics

**Default role** for new signups. API value: `rep`.

---

## Admin

**Business owner/manager**

- All User permissions
- View all agents' compliance & performance
- Create/manage compliance rules
- Receive violation alerts
- Set daily goals for team

**Org-scoped**: Admin has `role: admin` in `organization_members` for their org. API value: `admin`.

---

## Super Admin

**Platform owner (client)**

- All Admin permissions
- View all businesses' data
- Manage all users across platform
- Access platform-wide analytics
- System configuration

**Platform-wide**: No org restriction. API value: `super_admin`.

---

## API

- `GET /me` – Returns `user.platformRole` (`rep` | `admin` | `super_admin`)
- `PATCH /admin/users/:userId/platform-role` – Set platform role (Super Admin only)
- `GET /admin/users` – List all users (Super Admin only)

## Middleware

Roles are hierarchical: **rep < admin < super_admin**. A higher role satisfies checks for lower roles.

```ts
requirePlatformRole('admin')      // Admin or Super Admin
requirePlatformRole('super_admin') // Super Admin only
```

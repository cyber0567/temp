import type { PlatformRole } from "./api";

/** Display labels for platform roles */
export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  rep: "User (Rep)",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** Short labels for compact UI (e.g. dropdowns) */
export const PLATFORM_ROLE_SHORT_LABELS: Record<PlatformRole, string> = {
  rep: "Rep",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** Role descriptions (who they are) */
export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  rep: "Sales representative making calls",
  admin: "Business owner/manager",
  super_admin: "Platform owner (client)",
};

/** Permissions per role (for UI, help text, or feature gating) */
export const ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  rep: [
    "Access Rep Portal and Dialer",
    "View own compliance status",
    "Use AI Call Assistant",
    "View own performance metrics",
  ],
  admin: [
    "All User permissions",
    "View all agents' compliance & performance",
    "Create/manage compliance rules",
    "Receive violation alerts",
    "Set daily goals for team",
  ],
  super_admin: [
    "All Admin permissions",
    "View all businesses' data",
    "Manage all users across platform",
    "Access platform-wide analytics",
    "System configuration",
  ],
};

/** Role hierarchy: index higher = more privileges */
const ROLE_ORDER: PlatformRole[] = ["rep", "admin", "super_admin"];

/**
 * Returns true if the user's role has at least the required role level.
 * rep < admin < super_admin
 */
export function hasPlatformRole(userRole: PlatformRole | null | undefined, required: PlatformRole): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_ORDER.indexOf(userRole);
  const requiredLevel = ROLE_ORDER.indexOf(required);
  return userLevel >= requiredLevel;
}

/** Check if user can access Rep Portal / dialer (Rep and above) */
export function canAccessRepPortal(role: PlatformRole | null | undefined): boolean {
  return hasPlatformRole(role, "rep");
}

/** Check if user has Admin capabilities (Admin or Super Admin) */
export function canAccessAdminFeatures(role: PlatformRole | null | undefined): boolean {
  return hasPlatformRole(role, "admin");
}

/** Check if user is Super Admin */
export function isSuperAdmin(role: PlatformRole | null | undefined): boolean {
  return role === "super_admin";
}

/** Human-readable label for a platform role */
export function getPlatformRoleLabel(role: PlatformRole | null | undefined, short = false): string {
  if (!role) return "—";
  const map = short ? PLATFORM_ROLE_SHORT_LABELS : PLATFORM_ROLE_LABELS;
  return map[role] ?? role.replace(/_/g, " ");
}

/**
 * Role-based redirect path after login (RBAC).
 * SUPER_ADMIN -> dashboard (platform view); ADMIN -> dashboard; USER (rep) -> rep portal.
 */
export function getDashboardRedirectForRole(role: PlatformRole | null | undefined): string {
  if (!role) return "/dashboard";
  if (role === "rep") return "/dashboard/rep-portal";
  if (role === "admin" || role === "super_admin") return "/dashboard";
  return "/dashboard";
}

/**
 * Route access matrix: paths under /dashboard require at least this role.
 * rep: Dashboard, Rep Portal, Settings only
 * admin: All except super_admin-only
 * super_admin: All
 */
const ROUTE_MIN_ROLE: Record<string, PlatformRole> = {
  "/dashboard": "rep",
  "/dashboard/rep-portal": "rep",
  "/dashboard/settings": "rep",
};

const ADMIN_ROUTE_PREFIXES = [
  "/dashboard/command-center",
  "/dashboard/metrics",
  "/dashboard/talent",
  "/dashboard/clients",
  "/dashboard/quote-approvals",
  "/dashboard/campaigns",
  "/dashboard/call-center",
  "/dashboard/ai-coaching",
  "/dashboard/ai-lead",
  "/dashboard/training",
  "/dashboard/compliance",
  "/dashboard/quality-assurance",
  "/dashboard/analytics",
  "/dashboard/knowledge-base",
  "/dashboard/social-feed",
  "/dashboard/management",
  "/dashboard/orgs",
  "/dashboard/admin",
  "/dashboard/users",
];

/**
 * Returns the minimum role required for a dashboard path, or null if accessible to all.
 */
export function getMinRoleForPath(pathname: string): PlatformRole | null {
  const normalized = pathname.replace(/\/+$/, "") || "/dashboard";
  if (ROUTE_MIN_ROLE[normalized]) return ROUTE_MIN_ROLE[normalized];
  if (normalized === "/dashboard") return "rep";
  const requiresAdmin = ADMIN_ROUTE_PREFIXES.some((p) => normalized === p || normalized.startsWith(p + "/"));
  return requiresAdmin ? "admin" : "rep";
}

/**
 * Returns true if the user's role can access the given path.
 */
export function canAccessPath(pathname: string, userRole: PlatformRole | null | undefined): boolean {
  const minRole = getMinRoleForPath(pathname);
  if (!minRole) return true;
  return hasPlatformRole(userRole, minRole);
}

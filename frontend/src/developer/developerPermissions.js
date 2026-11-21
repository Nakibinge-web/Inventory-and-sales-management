/**
 * Developer Portal Permission Helpers.
 * Enforces authoritative granular permissions attached to the user's roles.
 */
export function can(user, permission) {
  if (!user) return false;
  const roles = user.roles || [];

  // System developer role has platform-wide authority
  if (roles.some(r => r.name === 'developer')) {
    return true;
  }

  // Check granular permission attached to any of the user's assigned roles
  return roles.some(role =>
    (role.permissions || []).some(p => p.name === permission)
  );
}

export function isDeveloper(user) {
  return can(user, 'developer.portal.access');
}

export const PERMISSIONS = {
  PORTAL_ACCESS: 'developer.portal.access',
  TENANTS_VIEW: 'developer.tenants.view',
  TENANTS_MANAGE: 'developer.tenants.manage',
  SUBSCRIPTIONS_VIEW: 'developer.subscriptions.view',
  SUBSCRIPTIONS_MANAGE: 'developer.subscriptions.manage',
  TELEMETRY_VIEW: 'developer.telemetry.view',
  ACTIVITY_VIEW: 'developer.activity.view',
};

const developerPermissions = {
  can,
  isDeveloper,
  PERMISSIONS,
};

export default developerPermissions;

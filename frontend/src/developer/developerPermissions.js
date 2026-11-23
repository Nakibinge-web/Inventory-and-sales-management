/**
 * Developer Portal Permission Helpers.
 * Requires BOTH the platform 'developer' role AND explicit granular permissions attached to it.
 */
export function can(user, permission) {
  if (!user) return false;
  const roles = user.roles || [];

  const developerRole = roles.find(r => r.name === 'developer');
  if (!developerRole) {
    return false;
  }

  return (developerRole.permissions || []).some(p => p.name === permission);
}

export function isDeveloper(user) {
  return can(user, PERMISSIONS.PORTAL_ACCESS);
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

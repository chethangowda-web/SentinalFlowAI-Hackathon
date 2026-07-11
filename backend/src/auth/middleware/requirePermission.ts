import { Context, Next } from 'hono';
import { PermissionService, PermissionScope } from '../authorization/PermissionService';

export function requirePermission(permission: PermissionScope) {
  return async (c: Context, next: Next) => {
    const role = c.get('userRole');
    if (!role) {
      return c.json({ error: 'Forbidden: Role context not resolved' }, 403);
    }

    const allowed = PermissionService.hasPermission(role, permission);
    if (!allowed) {
      return c.json({ error: `Forbidden: Missing scope '${permission}'` }, 403);
    }

    await next();
  };
}

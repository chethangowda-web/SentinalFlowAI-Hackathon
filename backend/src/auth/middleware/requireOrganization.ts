import { Context, Next } from 'hono';

export async function requireOrganization(c: Context, next: Next) {
  const sessionOrgId = c.get('organizationId');
  const requestOrgId = c.req.header('X-Organization-ID');

  if (requestOrgId && sessionOrgId && requestOrgId !== sessionOrgId) {
    return c.json({ error: 'Forbidden: Tenant workspace mismatch' }, 403);
  }

  // Fallback to session org id if header not specified
  if (!sessionOrgId) {
    return c.json({ error: 'Forbidden: No organization context established' }, 403);
  }

  await next();
}

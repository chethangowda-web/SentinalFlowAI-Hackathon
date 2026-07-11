import { UserRole } from '../types/types';

export enum PermissionScope {
  INCIDENT_READ = 'incident:read',
  INCIDENT_CREATE = 'incident:create',
  INCIDENT_EDIT = 'incident:edit',
  INCIDENT_DELETE = 'incident:delete',
  RUNBOOK_READ = 'runbook:read',
  RUNBOOK_CREATE = 'runbook:create',
  RUNBOOK_EDIT = 'runbook:edit',
  RUNBOOK_EXECUTE = 'runbook:execute',
  RUNBOOK_DELETE = 'runbook:delete',
  AUDIT_READ = 'audit:read',
  API_KEY_CREATE = 'apikey:create',
  API_KEY_ROTATE = 'apikey:rotate',
  ORG_SETTINGS_EDIT = 'org:settings:edit',
  TEAM_EDIT = 'team:edit',
}

export class PermissionService {
  private static rolePermissions: Record<UserRole, PermissionScope[]> = {
    [UserRole.OWNER]: Object.values(PermissionScope),
    [UserRole.ADMIN]: [
      PermissionScope.INCIDENT_READ, PermissionScope.INCIDENT_CREATE, PermissionScope.INCIDENT_EDIT,
      PermissionScope.RUNBOOK_READ, PermissionScope.RUNBOOK_CREATE, PermissionScope.RUNBOOK_EDIT, PermissionScope.RUNBOOK_EXECUTE,
      PermissionScope.AUDIT_READ, PermissionScope.API_KEY_CREATE, PermissionScope.API_KEY_ROTATE,
      PermissionScope.TEAM_EDIT
    ],
    [UserRole.SECURITY_ENGINEER]: [
      PermissionScope.INCIDENT_READ, PermissionScope.INCIDENT_CREATE, PermissionScope.INCIDENT_EDIT,
      PermissionScope.RUNBOOK_READ, PermissionScope.RUNBOOK_EXECUTE, PermissionScope.AUDIT_READ
    ],
    [UserRole.DEVOPS_ENGINEER]: [
      PermissionScope.INCIDENT_READ, PermissionScope.INCIDENT_CREATE, PermissionScope.INCIDENT_EDIT,
      PermissionScope.RUNBOOK_READ, PermissionScope.RUNBOOK_CREATE, PermissionScope.RUNBOOK_EDIT, PermissionScope.RUNBOOK_EXECUTE
    ],
    [UserRole.SRE]: [
      PermissionScope.INCIDENT_READ, PermissionScope.INCIDENT_CREATE, PermissionScope.INCIDENT_EDIT,
      PermissionScope.RUNBOOK_READ, PermissionScope.RUNBOOK_EXECUTE
    ],
    [UserRole.DEVELOPER]: [
      PermissionScope.INCIDENT_READ, PermissionScope.INCIDENT_CREATE, PermissionScope.INCIDENT_EDIT
    ],
    [UserRole.VIEWER]: [
      PermissionScope.INCIDENT_READ, PermissionScope.RUNBOOK_READ
    ],
  };

  public static hasPermission(role: string, permission: PermissionScope): boolean {
    const list = this.rolePermissions[role as UserRole];
    if (!list) return false;
    return list.includes(permission);
  }
}

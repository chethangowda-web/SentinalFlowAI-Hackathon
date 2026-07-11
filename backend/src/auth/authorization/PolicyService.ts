import { PermissionService, PermissionScope } from './PermissionService';
import { UserRole } from '../types/types';

export class PolicyService {
  public static canAssignIncident(role: string): boolean {
    return PermissionService.hasPermission(role, PermissionScope.INCIDENT_EDIT);
  }

  public static canDeleteIncident(role: string): boolean {
    return PermissionService.hasPermission(role, PermissionScope.INCIDENT_DELETE);
  }

  public static canEditRunbook(role: string): boolean {
    return PermissionService.hasPermission(role, PermissionScope.RUNBOOK_EDIT);
  }

  public static canApproveRunbook(role: string): boolean {
    // Only SRE, DevOps, Admins or Owner can approve execution runs
    const allowed = [UserRole.OWNER, UserRole.ADMIN, UserRole.DEVOPS_ENGINEER, UserRole.SRE];
    return allowed.includes(role as UserRole);
  }

  public static canViewAuditLogs(role: string): boolean {
    return PermissionService.hasPermission(role, PermissionScope.AUDIT_READ);
  }

  public static canCreateApiKeys(role: string): boolean {
    return PermissionService.hasPermission(role, PermissionScope.API_KEY_CREATE);
  }
}

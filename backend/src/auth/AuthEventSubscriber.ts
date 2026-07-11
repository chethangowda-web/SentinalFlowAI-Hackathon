import { EventHandler, IEventHandler } from '../events/EventRegistry';
import { BaseDomainEvent } from '../events/types/BaseDomainEvent';
import { auditRepository } from '../database/repositories/AuditRepository';
import { randomUUID } from 'crypto';

@EventHandler('UserCreated')
export class AuthUserCreatedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    await auditRepository.appendAudit({
      id: randomUUID(),
      userId: payload.userId,
      action: 'USER_CREATED',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: payload,
    });
  }
}

@EventHandler('UserLoggedIn')
export class AuthUserLoggedInSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    await auditRepository.appendAudit({
      id: randomUUID(),
      userId: payload.userId,
      action: 'USER_LOGGED_IN',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: { sessionId: payload.sessionId },
    });
  }
}

@EventHandler('UserLoggedOut')
export class AuthUserLoggedOutSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    await auditRepository.appendAudit({
      id: randomUUID(),
      userId: payload.userId,
      action: 'USER_LOGGED_OUT',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: { sessionId: payload.sessionId },
    });
  }
}

@EventHandler('RoleChanged')
export class AuthRoleChangedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    await auditRepository.appendAudit({
      id: randomUUID(),
      userId: payload.userId,
      action: 'ROLE_CHANGED',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: { previousRole: payload.previousRole, newRole: payload.newRole, updatedBy: payload.updatedBy },
    });
  }
}

@EventHandler('InvitationCreated')
export class AuthInvitationCreatedSubscriber implements IEventHandler {
  async handle(event: BaseDomainEvent): Promise<void> {
    const payload = event.payload as any;
    await auditRepository.appendAudit({
      id: randomUUID(),
      userId: 'SYSTEM',
      action: 'INVITATION_CREATED',
      ipAddress: null,
      timestamp: new Date(event.occurredAt),
      metadata: payload,
    });
  }
}

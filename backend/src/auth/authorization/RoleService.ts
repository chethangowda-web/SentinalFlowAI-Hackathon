import { UserRole } from '../types/types';
import { authRepository } from '../../database/repositories/AuthRepository';
import { eventPublisher } from '../../events/EventPublisher';

export class RoleService {
  public static async assignRole(userId: string, role: UserRole, actorId: string): Promise<void> {
    const user = await authRepository.getUserById(userId);
    if (!user) throw new Error('User not found');

    const previousRole = user.role;
    user.role = role;
    await authRepository.updateUser(userId, user);

    eventPublisher.publish('RoleChanged', userId, 'User', {
      userId,
      previousRole,
      newRole: role,
      updatedBy: actorId,
    });
  }
}

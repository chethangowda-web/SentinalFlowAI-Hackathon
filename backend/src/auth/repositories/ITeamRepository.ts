import { Team, User } from '../types/types';

export interface ITeamRepository {
  createTeam(team: Team): Promise<Team>;
  getTeamById(teamId: string): Promise<Team | null>;
  listTeams(orgId: string): Promise<Team[]>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;
  addTeamMember(teamId: string, userId: string): Promise<void>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  listTeamMembers(teamId: string): Promise<User[]>;
}

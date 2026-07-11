import { Organization, OrganizationSettings, OrganizationInvitation } from '../types/types';

export interface IOrganizationRepository {
  createOrganization(org: Organization, settings: OrganizationSettings): Promise<Organization>;
  getOrganizationById(id: string): Promise<Organization | null>;
  getOrganizationBySlug(slug: string): Promise<Organization | null>;
  listOrganizations(): Promise<Organization[]>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<void>;
  createInvitation(invite: OrganizationInvitation): Promise<OrganizationInvitation>;
  getInvitationByToken(token: string): Promise<OrganizationInvitation | null>;
  updateInvitationStatus(id: string, status: string): Promise<void>;
}

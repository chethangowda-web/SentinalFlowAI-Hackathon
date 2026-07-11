import { randomUUID } from 'crypto';
import { incidentRepository } from '../../database/repositories/IncidentRepository';
import { notesRepository } from '../../database/repositories/NotesRepository';
import { statusTransitionService } from './StatusTransitionService';
import { Incident } from '../../database/entities/Incident';
import { IncidentAssignment, IncidentResolution } from '../entities/LifecycleEntities';
import { IncidentNote } from '../entities/NotesEntities';
import { IncidentStatus, TimelineEventType } from '../types/status';
import { ValidationError, NotFoundError } from '../../core/errors/LifecycleErrors';
import { LoggerService } from '../../mastra/services/loggerService';
import { domainEvents } from '../events/DomainEvents';
import { 
  UpdateStatusDTO, AssignDTO, ResolveDTO, CloseDTO, 
  CreateNoteDTO, UpdateNoteDTO, SearchFilterDTO 
} from '../dto/IncidentDTO';

export class IncidentService {
  private log: LoggerService;

  constructor() {
    this.log = new LoggerService('IncidentService');
  }

  public async getIncident(incidentId: string): Promise<Incident> {
    const incident = await incidentRepository.getIncidentById(incidentId);
    if (!incident) {
      throw new NotFoundError(`Incident ${incidentId} not found or has been deleted`);
    }
    return incident;
  }

  public async listIncidents(filters: SearchFilterDTO): Promise<Incident[]> {
    return incidentRepository.getIncidents(filters);
  }

  public async changeStatus(incidentId: string, dto: UpdateStatusDTO): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    statusTransitionService.validateTransition(incident.status, dto.status);
    
    const updated = await incidentRepository.updateStatus(incidentId, dto.status, dto.version);
    
    domainEvents.emitStatusChanged({
      incidentId,
      actor: dto.actor,
      previousStatus: incident.status as IncidentStatus,
      newStatus: dto.status,
      notes: dto.notes,
    });
    
    this.log.info(`[${incidentId}] Status changed to ${dto.status} by ${dto.actor}`);
    return updated;
  }

  public async assignIncident(incidentId: string, dto: AssignDTO): Promise<IncidentAssignment> {
    let incident = await this.getIncident(incidentId);
    
    if (incident.status === IncidentStatus.CLOSED) {
      throw new ValidationError(`Cannot assign a closed incident`);
    }
    
    const isNewAssignment = !incident.assignedEngineer;

    const assignment = await incidentRepository.assignEngineer({
      id: randomUUID(),
      incidentId,
      assignedEngineerId: dto.engineerId,
      assignedEngineerName: dto.engineerName,
      assignedBy: dto.assignedBy,
      assignedAt: new Date()
    }, dto.version);

    domainEvents.emitTimelineEvent({
      incidentId,
      actor: dto.assignedBy,
      action: isNewAssignment ? TimelineEventType.ASSIGNED : TimelineEventType.REASSIGNED,
      oldValue: incident.assignedEngineer || undefined,
      newValue: dto.engineerId,
      metadata: { engineerId: dto.engineerId, engineerName: dto.engineerName }
    });

    this.log.info(`[${incidentId}] Assigned to ${dto.engineerName} by ${dto.assignedBy}`);
    return assignment;
  }

  public async resolveIncident(incidentId: string, dto: ResolveDTO): Promise<IncidentResolution> {
    let incident = await this.getIncident(incidentId);
    
    if (incident.status !== IncidentStatus.INVESTIGATING && incident.status !== IncidentStatus.MITIGATED) {
      throw new ValidationError(`Incident must be INVESTIGATING or MITIGATED before resolution. Current: ${incident.status}`);
    }

    const resolution = await incidentRepository.saveResolution({
      id: randomUUID(),
      incidentId,
      summary: dto.summary,
      rootCause: dto.rootCause,
      correctiveActions: dto.correctiveActions,
      preventiveActions: dto.preventiveActions,
      resolvedBy: dto.resolvedBy,
      resolvedAt: new Date()
    }, dto.version);

    // After resolving, we automatically transition the status via the normal repo method, 
    // but the incident version was already incremented by saveResolution, so we must fetch the updated version.
    incident = await this.getIncident(incidentId);
    
    await this.changeStatus(incidentId, {
      status: IncidentStatus.RESOLVED,
      actor: dto.resolvedBy,
      notes: `Resolution provided: ${dto.rootCause}`,
      version: incident.version
    });

    domainEvents.emitTimelineEvent({
      incidentId,
      actor: dto.resolvedBy,
      action: TimelineEventType.RESOLUTION_ADDED,
      metadata: { resolutionId: resolution.id }
    });

    this.log.info(`[${incidentId}] Resolved by ${dto.resolvedBy}`);
    return resolution;
  }

  public async closeIncident(incidentId: string, dto: CloseDTO): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (incident.status === IncidentStatus.CLOSED) {
      return incident;
    }
    return this.changeStatus(incidentId, {
      status: IncidentStatus.CLOSED,
      actor: dto.closedBy,
      notes: dto.notes || `Incident closed`,
      version: dto.version
    });
  }

  public async addNote(incidentId: string, dto: CreateNoteDTO): Promise<IncidentNote> {
    const incident = await this.getIncident(incidentId); // verify exists
    
    const note = await notesRepository.createNote({
      id: randomUUID(),
      incidentId,
      author: dto.author,
      markdown: dto.markdown
    });

    domainEvents.emitTimelineEvent({
      incidentId,
      actor: dto.author,
      action: TimelineEventType.NOTE_ADDED,
      metadata: { noteId: note.id }
    });

    return note;
  }

  public async getNotes(incidentId: string): Promise<IncidentNote[]> {
    await this.getIncident(incidentId); // verify exists
    return notesRepository.getNotesForIncident(incidentId);
  }

  public async softDeleteIncident(incidentId: string, deletedBy: string, version: number): Promise<void> {
    await incidentRepository.softDelete(incidentId, deletedBy, version);
    
    domainEvents.emitAudit({
      incidentId,
      actor: deletedBy,
      action: TimelineEventType.INCIDENT_CLOSED, // Using closed or a specific DELETED enum if added
      metadata: { softDelete: true }
    });
    
    this.log.info(`[${incidentId}] Soft deleted by ${deletedBy}`);
  }
}

export const incidentService = new IncidentService();

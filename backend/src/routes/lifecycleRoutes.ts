import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';
import { incidentService } from '../incidents/services/IncidentService';
import { statisticsService } from '../incidents/services/StatisticsService';
import { incidentRepository } from '../database/repositories/IncidentRepository';
import { timelineRepository } from '../database/repositories/TimelineRepository';
import { auditRepository } from '../database/repositories/AuditRepository';
import { IncidentStatus, TimelineEventType } from '../incidents/types/status';
import { BaseApplicationError } from '../core/errors/BaseApplicationError';
import { domainEvents } from '../incidents/events/DomainEvents';
import {
  createIncidentSchema,
  updateStatusSchema,
  assignSchema,
  resolveSchema,
  closeSchema,
  createNoteSchema,
  updateNoteSchema,
  searchFilterSchema
} from '../incidents/dto/IncidentDTO';

const handleError = (c: any, error: unknown) => {
  if (error instanceof BaseApplicationError) {
    return c.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        timestamp: error.timestamp,
        details: error.details,
      }
    }, error.httpStatus);
  }
  const msg = error instanceof Error ? error.message : 'Unknown error';
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: msg,
      retryable: false,
      timestamp: new Date().toISOString(),
    }
  }, 500);
};

// ------------------------------------------------------------------
// Incidents API
// ------------------------------------------------------------------

export const createIncidentRoute = registerApiRoute('/custom/v1/incidents', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const parsed = createIncidentSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const incidentId = randomUUID();
      const incident = await incidentRepository.createIncident({
        ...parsed.data,
        incidentId,
        status: IncidentStatus.OPEN,
      });

      domainEvents.emitTimelineEvent({
        incidentId,
        actor: 'SYSTEM',
        action: TimelineEventType.INCIDENT_CREATED,
        newValue: IncidentStatus.OPEN,
        notes: 'Incident created via API',
      });

      return c.json({ success: true, incident }, 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const getIncidentsRoute = registerApiRoute('/custom/v1/incidents', {
  method: 'GET',
  handler: async (c) => {
    try {
      const qs = c.req.query ? c.req.query() : {};
      const parsed = searchFilterSchema.safeParse(qs);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: parsed.error.issues } }, 400);
      }
      
      const incidents = await incidentService.listIncidents(parsed.data);
      return c.json({ success: true, data: incidents }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const getIncidentByIdRoute = registerApiRoute('/custom/v1/incidents/:id', {
  method: 'GET',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const incident = await incidentService.getIncident(id);
      return c.json({ success: true, data: incident }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const updateIncidentStatusRoute = registerApiRoute('/custom/v1/incidents/:id/status', {
  method: 'PATCH',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const parsed = updateStatusSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const updated = await incidentService.changeStatus(id, parsed.data);
      return c.json({ success: true, data: updated }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const assignIncidentRoute = registerApiRoute('/custom/v1/incidents/:id/assign', {
  method: 'PATCH',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const parsed = assignSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const assignment = await incidentService.assignIncident(id, parsed.data);
      return c.json({ success: true, data: assignment }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const resolveIncidentRoute = registerApiRoute('/custom/v1/incidents/:id/resolve', {
  method: 'PATCH',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const parsed = resolveSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const resolution = await incidentService.resolveIncident(id, parsed.data);
      return c.json({ success: true, data: resolution }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const closeIncidentRoute = registerApiRoute('/custom/v1/incidents/:id/close', {
  method: 'PATCH',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const parsed = closeSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const closed = await incidentService.closeIncident(id, parsed.data);
      return c.json({ success: true, data: closed }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const deleteIncidentRoute = registerApiRoute('/custom/v1/incidents/:id', {
  method: 'DELETE',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      if (!body.deletedBy || !body.version) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'deletedBy and version required' } }, 400);
      }
      
      await incidentService.softDeleteIncident(id, body.deletedBy, body.version);
      return c.json({ success: true, message: 'Incident soft deleted' }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

// ------------------------------------------------------------------
// Notes & Timeline API
// ------------------------------------------------------------------

export const addNoteRoute = registerApiRoute('/custom/v1/incidents/:id/notes', {
  method: 'POST',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const parsed = createNoteSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } }, 400);
      }
      
      const note = await incidentService.addNote(id, parsed.data);
      return c.json({ success: true, data: note }, 201);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const getNotesRoute = registerApiRoute('/custom/v1/incidents/:id/notes', {
  method: 'GET',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const notes = await incidentService.getNotes(id);
      return c.json({ success: true, data: notes }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const getTimelineRoute = registerApiRoute('/custom/v1/incidents/:id/timeline', {
  method: 'GET',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      // Verify incident exists first
      await incidentService.getIncident(id);
      const timeline = await timelineRepository.getTimeline(id);
      return c.json({ success: true, data: timeline }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const getAuditRoute = registerApiRoute('/custom/v1/incidents/:id/audit', {
  method: 'GET',
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      await incidentService.getIncident(id);
      const audits = await auditRepository.getAudits(id);
      return c.json({ success: true, data: audits }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

// ------------------------------------------------------------------
// Dashboard API
// ------------------------------------------------------------------

export const dashboardOverviewRoute = registerApiRoute('/custom/v1/dashboard/overview', {
  method: 'GET',
  handler: async (c) => {
    try {
      const stats = await statisticsService.getDashboardStats();
      return c.json({ success: true, data: stats }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const dashboardTrendsRoute = registerApiRoute('/custom/v1/dashboard/trends', {
  method: 'GET',
  handler: async (c) => {
    try {
      const trends = await statisticsService.getTrendStats();
      return c.json({ success: true, data: trends }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const dashboardSeverityRoute = registerApiRoute('/custom/v1/dashboard/severity', {
  method: 'GET',
  handler: async (c) => {
    try {
      const severity = await statisticsService.getSeverityStats();
      return c.json({ success: true, data: severity }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

export const dashboardServicesRoute = registerApiRoute('/custom/v1/dashboard/services', {
  method: 'GET',
  handler: async (c) => {
    try {
      const services = await statisticsService.getServiceStats();
      return c.json({ success: true, data: services }, 200);
    } catch (error) {
      return handleError(c, error);
    }
  }
});

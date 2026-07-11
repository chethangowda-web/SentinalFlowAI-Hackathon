import { z } from 'zod';
import { IncidentStatus, Priority } from '../types/status';

// Common structures
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  sort: z.string().optional(),
  order: z.enum(['ASC', 'DESC']).optional(),
});

// Create
export const createIncidentSchema = z.object({
  service: z.string().min(1, 'Service is required'),
  application: z.string().min(1, 'Application is required'),
  environment: z.enum(['dev', 'staging', 'production']),
  severity: z.string().min(1, 'Severity is required'),
  priority: z.nativeEnum(Priority).default(Priority.P4),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().min(1, 'Description is required'),
  rawLogs: z.string(),
  assignedEngineer: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Update Status
export const updateStatusSchema = z.object({
  status: z.nativeEnum(IncidentStatus),
  actor: z.string().min(1, 'Actor is required'),
  notes: z.string().optional(),
  version: z.number().int().min(1, 'Version is required for optimistic locking'),
});

// Assign
export const assignSchema = z.object({
  engineerId: z.string().min(1, 'Engineer ID is required'),
  engineerName: z.string().min(1, 'Engineer Name is required'),
  assignedBy: z.string().min(1, 'Assigner is required'),
  version: z.number().int().min(1, 'Version is required for optimistic locking'),
});

// Resolve
export const resolveSchema = z.object({
  resolvedBy: z.string().min(1, 'Resolver is required'),
  summary: z.string().min(1, 'Summary is required'),
  rootCause: z.string().min(1, 'Root cause is required'),
  correctiveActions: z.string().min(1, 'Corrective actions are required'),
  preventiveActions: z.string().min(1, 'Preventive actions are required'),
  version: z.number().int().min(1, 'Version is required for optimistic locking'),
});

// Close
export const closeSchema = z.object({
  closedBy: z.string().min(1, 'Closer is required'),
  notes: z.string().optional(),
  version: z.number().int().min(1, 'Version is required for optimistic locking'),
});

// Notes
export const createNoteSchema = z.object({
  author: z.string().min(1, 'Author is required'),
  markdown: z.string().min(1, 'Markdown content is required'),
});

export const updateNoteSchema = z.object({
  author: z.string().min(1, 'Author is required'),
  markdown: z.string().min(1, 'Markdown content is required'),
});

// Search Filter
export const searchFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(IncidentStatus).optional(),
  severity: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedEngineer: z.string().optional(),
  environment: z.string().optional(),
  service: z.string().optional(),
  keyword: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
});

// Types exported based on Zod inference
export type CreateIncidentDTO = z.infer<typeof createIncidentSchema>;
export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;
export type AssignDTO = z.infer<typeof assignSchema>;
export type ResolveDTO = z.infer<typeof resolveSchema>;
export type CloseDTO = z.infer<typeof closeSchema>;
export type CreateNoteDTO = z.infer<typeof createNoteSchema>;
export type UpdateNoteDTO = z.infer<typeof updateNoteSchema>;
export type SearchFilterDTO = z.infer<typeof searchFilterSchema>;

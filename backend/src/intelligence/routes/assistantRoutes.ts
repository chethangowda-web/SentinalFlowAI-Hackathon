import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { assistantService } from '../services/AssistantService';
import { BaseApplicationError } from '../../core/errors/BaseApplicationError';

const chatRequestSchema = z.object({
  message: z.string().min(1),
  incidentId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

export const assistantChatRoute = registerApiRoute('/custom/v1/assistant/chat', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const parsed = chatRequestSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parsed.error.issues } 
        }, 400);
      }
      
      const response = await assistantService.chat(parsed.data);
      
      return c.json({ success: true, data: response }, 200);
    } catch (error) {
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
    }
  }
});

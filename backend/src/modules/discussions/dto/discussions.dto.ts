import { z } from 'zod';

export const createDiscussionSchema = z.object({
    title: z.string().min(3, 'Title too short').max(100, 'Title too long'),
    content: z.string().min(10, 'Content too short').max(5000, 'Content too long'),
    projectId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
});

export type CreateDiscussionDto = z.infer<typeof createDiscussionSchema>;

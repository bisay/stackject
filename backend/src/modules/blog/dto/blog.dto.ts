import { z } from 'zod';

export const articleSchema = z.object({
    title: z.string().min(5),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    content: z.string().min(100),
    projectId: z.string().uuid().optional(),
    published: z.boolean().default(false),
});

export type CreateArticleDto = z.infer<typeof articleSchema>;

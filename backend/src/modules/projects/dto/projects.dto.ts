import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    description: z.string().min(10, 'Description is too short'),
    repoUrl: z.string().url().optional().or(z.literal('')),
    demoUrl: z.string().url().optional().or(z.literal('')),
    tags: z.string().optional(),
    visibility: z.enum(['public', 'private']).default('public'),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
    status: z.enum(['active', 'beta', 'archived']).optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_\-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

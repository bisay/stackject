import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^[a-zA-Z0-9_\-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

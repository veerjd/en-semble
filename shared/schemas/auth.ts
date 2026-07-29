import { z } from 'zod'

export const usernameSchema = z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/)

export const registerSchema = z.object({
    token: z.string().min(1).max(128),
    email: z.email().max(254),
    password: z.string().min(8).max(128),
    username: usernameSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>

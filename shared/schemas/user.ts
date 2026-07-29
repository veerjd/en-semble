import { z } from 'zod'
import { usernameSchema } from './auth'

export const patchMeSchema = z
    .object({
        username: usernameSchema.optional(),
        bio: z.string().max(500).nullable().optional(),
        locale: z.enum(['fr', 'en']).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'empty_patch' })

export type PatchMeInput = z.infer<typeof patchMeSchema>

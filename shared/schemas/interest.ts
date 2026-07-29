import { z } from 'zod'

export const createInterestSchema = z.object({
    label: z.string().trim().min(1).max(50),
})

export const replaceInterestsSchema = z.object({
    interest_ids: z.array(z.uuid()).max(50),
})

export type CreateInterestInput = z.infer<typeof createInterestSchema>
export type ReplaceInterestsInput = z.infer<typeof replaceInterestsSchema>

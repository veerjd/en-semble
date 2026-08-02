import { z } from 'zod'

export const createInvitesSchema = z
    .object({
        emails: z.array(z.email().max(254)).max(100).optional(),
        count: z.number().int().min(1).max(100).optional(),
        expires_at: z.iso.datetime({ offset: true }),
    })
    .refine((v) => (v.emails?.length ?? 0) > 0 || (v.count ?? 0) > 0, {
        message: 'emails_or_count_required',
    })
    .refine((v) => new Date(v.expires_at) > new Date(), {
        message: 'expiry_in_past',
    })

export type CreateInvitesInput = z.infer<typeof createInvitesSchema>

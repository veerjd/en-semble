import type { H3Event } from 'h3'
import type { z } from 'zod'

/**
 * Read and validate the request body against a zod schema.
 * Fails with 400 and the flattened field errors in `data.fields`.
 */
export const readValidated = async <S extends z.ZodType>(
    event: H3Event,
    schema: S,
): Promise<z.output<S>> => {
    const body = await readBody(event)
    const result = schema.safeParse(body)
    if (!result.success) {
        throw createError({
            statusCode: 400,
            message: 'validation_failed',
            data: {
                code: 'validation_failed',
                fields: result.error.issues.map((i) => ({
                    path: i.path.join('.'),
                    code: i.code,
                })),
            },
        })
    }
    return result.data
}

/**
 * Get a route param, 400 when missing or (by default) not a UUID.
 */
export const requireParam = (
    event: H3Event,
    name: string,
    opts: { uuid?: boolean } = { uuid: true },
): string => {
    const value = getRouterParam(event, name)
    if (!value) apiError(400, 'missing_param')
    if (
        opts.uuid &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value!,
        )
    ) {
        apiError(400, 'invalid_param')
    }
    return value!
}

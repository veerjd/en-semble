import type { InterestDTO } from '~~/shared/types/api'

/**
 * Display label for an interest: seeded interests have translations keyed
 * by slug (interests.<slug>); user-generated ones fall back to their raw
 * label.
 */
export const useInterestLabel = () => {
    const { t, te } = useI18n()
    return (interest: InterestDTO): string =>
        te(`interests.${interest.slug}`)
            ? t(`interests.${interest.slug}`)
            : interest.label
}

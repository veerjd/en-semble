import { describe, expect, it } from 'vitest'
import { slugify } from '~~/server/utils/slugify'

describe('slugify', () => {
    it('matches the seeded slug style', () => {
        expect(slugify('Bible Study Methodology')).toBe(
            'bible_study_methodology',
        )
    })

    it('strips accents', () => {
        expect(slugify('Théologie & Débats')).toBe('theologie_debats')
    })

    it('collapses punctuation and trims underscores', () => {
        expect(slugify('  hello --- world!! ')).toBe('hello_world')
    })

    it('returns empty for labels with no usable characters', () => {
        expect(slugify('!!!')).toBe('')
    })
})

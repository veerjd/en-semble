import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '~~': fileURLToPath(new URL('.', import.meta.url)),
            // Nuxt virtual module — stubbed for tests (see tests/integration).
            '#supabase/server': fileURLToPath(
                new URL(
                    './tests/integration/support/supabaseServerStub.ts',
                    import.meta.url,
                ),
            ),
        },
    },
    test: {
        include: ['tests/**/*.test.ts'],
    },
})

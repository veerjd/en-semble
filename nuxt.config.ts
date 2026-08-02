import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
    compatibilityDate: '2026-07-01',
    app: {
        head: {
            title: 'En-Semble',
        },
    },
    components: [
        {
            path: '~/components',
            pathPrefix: false,
        },
    ],
    supabase: {
        // Empty-string fallbacks keep these keys present in the serialized
        // runtime config. Nitro's env overrides (NUXT_PUBLIC_SUPABASE_URL /
        // NUXT_PUBLIC_SUPABASE_KEY / NUXT_SUPABASE_SERVICE_KEY) only apply to
        // keys that already exist, so this is what lets Netlify inject values
        // at function-invocation time rather than baking them at build time.
        // Note: serverSupabaseServiceRole reads `secretKey || serviceKey`, so
        // NUXT_SUPABASE_SECRET_KEY takes precedence if both are set.
        url: process.env.SUPABASE_URL ?? '',
        key: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
        serviceKey: process.env.SUPABASE_SECRET_KEY ?? '',
        // The module derives the session cookie name from the Supabase URL.
        // Pin it explicitly so deploy previews and production share a stable
        // cookie name regardless of which URL was present at build time.
        cookiePrefix: process.env.NUXT_PUBLIC_SUPABASE_COOKIE_PREFIX ?? '',
        types: '~~/shared/types/database.types.ts',
        redirectOptions: {
            login: '/login',
            callback: '/confirm',
            include: undefined,
            exclude: ['/login', '/register/*', '/confirm', '/logout', '/api/*'],
            saveRedirectToCookie: true,
        },
    },
    typescript: {
        typeCheck: true,
        strict: true,
    },
    css: ['primeicons/primeicons.css'],
    modules: [
        '@primevue/nuxt-module',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        '@nuxtjs/supabase',
        '@nuxtjs/i18n',
        '@nuxt/icon',
    ],
    colorMode: {
        classSuffix: '',
    },
    i18n: {
        defaultLocale: 'fr',
        strategy: 'no_prefix',
        locales: [
            { code: 'en', file: 'en.json' },
            { code: 'fr', file: 'fr.json' },
        ],
    },
    primevue: {
        autoImport: true,
        options: {
            ripple: true,
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.dark',
                    cssLayer: false,
                },
            },
        },
    },
    nitro: {
        esbuild: {
            options: {
                target: 'esnext',
            },
        },
    },
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
})

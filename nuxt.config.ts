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
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
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

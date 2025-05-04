import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'

export default defineNuxtConfig({
    // debug: true,
    app: {
        head: {
            title: 'MachinOps',
        },
    },
    vue: {
        propsDestructure: true,
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
        redirectOptions: {
            login: '/login',
            callback: '/confirm',
            include: undefined,
            exclude: ['/update-password', '/logout', '/api/*', '/signup*'],
            cookieRedirect: true,
        },
    },
    devtools: {
        enabled: true,

        timeline: {
            enabled: true,
        },
    },
    typescript: {
        typeCheck: true,
        strict: false,
    },
    css: ['primeicons/primeicons.css'],
    modules: [
        '@primevue/nuxt-module',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        '@nuxtjs/supabase',
        'nuxt-icon',
        '@nuxtjs/i18n',
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
        usePrimeVue: true,
        options: {
            ripple: true,
            theme: {
                preset: Aura,
                darkModeSelector: 'media',
                cssLayer: false,
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

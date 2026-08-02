/** @type {import('tailwindcss').Config} */
// The previous 1000+ line config was a verbatim copy of Tailwind's full
// stock theme with a single customization: the sans font stack. Content
// globs are injected by @nuxtjs/tailwindcss.
// tailwindcss-primeui exposes the PrimeVue theme as utilities
// (bg-surface-*, text-color, text-muted-color, bg-primary, …) so custom
// markup follows the active light/dark preset automatically.
module.exports = {
    darkMode: 'selector',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('tailwindcss-primeui')],
}

/** @type {import('tailwindcss').Config} */
// The previous 1000+ line config was a verbatim copy of Tailwind's full
// stock theme with a single customization: the sans font stack. Content
// globs are injected by @nuxtjs/tailwindcss.
module.exports = {
    darkMode: 'selector',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                discord: {
                    primary: '#5865F2',
                    secondary: '#4752c4',
                    success: '#57F287',
                    warning: '#FEE75C',
                    danger: '#ED4245',
                }
            },
            animation: {
                'spin-slow': 'spin 1s linear infinite',
            }
        },
    },
    plugins: [],
}
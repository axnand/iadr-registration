/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        strongPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }, // lower opacity for stronger effect
        },
      },
      animation: {
        strongPulse: 'strongPulse 0.8s ease-in-out infinite', // faster than default
      },
    },
  },
  plugins: [],
};

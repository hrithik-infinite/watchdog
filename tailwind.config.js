/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        critical: '#DC2626',
        serious: '#EA580C',
        moderate: '#CA8A04',
        minor: '#2563EB',
      },
    },
  },
  plugins: [],
};

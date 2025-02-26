/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: "#00FFFF",
        neonPink: "#FF00FF",
        darkBg: "#0A0A0A",
      },
    },
  },
  plugins: [],
};
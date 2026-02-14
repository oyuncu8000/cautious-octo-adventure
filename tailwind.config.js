/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",   // App Router dosyalarını tarar
    "./pages/**/*.{js,ts,jsx,tsx}", // Eğer Pages Router varsa
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

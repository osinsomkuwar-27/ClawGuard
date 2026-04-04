/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#ECF4E8",
          soft: "#CBF3BB",
          mid: "#ABE7B2",
          accent: "#93BFC7",
        },
        allowed: { DEFAULT: "#16A34A", bg: "#F0FDF4" },
        blocked: { DEFAULT: "#DC2626", bg: "#FEF2F2" },
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}", // Cambio clave: quitar ts, tsx
  ],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#eef2ff", 600: "#4f46e5", 900: "#312e81" }, // (Resumido)
        status: { success: "#10b981", error: "#ef4444" },
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  plugins: [],
};

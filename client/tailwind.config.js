/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Colors extracted from Visily PDF
        brand: {
          blue: "#0F4C81", // Deep Blue (Headers)
          red: "#D32F2F", // Red (Login Button)
          gray: "#F5F7FA", // Light Gray Background
        },
        faculty: {
          engineering: "#E74C3C",
          medicine: "#1ABC9C",
          arts: "#34495E",
          business: "#F1C40F",
          sciences: "#E67E22",
        },
        status: {
          success: "#10b981",
          warning: "#F59E0B",
          error: "#ef4444",
          neutral: "#64748B",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

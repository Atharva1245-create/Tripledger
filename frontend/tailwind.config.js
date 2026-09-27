/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#3D1B5B",      // Sidebar deep plum background
          darkPurple: "#2D1344",  // Darker shade for buttons/headers
          lightPurple: "#F3EAF8", // Light purple card background
          accentGold: "#D5BD97",  // Warm gold for AI buttons
          goldGradientEnd: "#C8A873",
          creamBg: "#FAF2EA",     // Main app background
          creamCard: "#FFFFFF",
          whatsappGreen: "#22C55E",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(61, 27, 91, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

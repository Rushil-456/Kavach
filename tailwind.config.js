/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      colors: {
        // ── Official Kavach Enterprise Palette ──────────────────────────────
        // All keys are simple words — no hyphens inside the color name object
        kavach: {
          navy:    "#0D3B66",   // Deep Navy  — primary text (light), dark-mode bg
          teal:    "#235B7E",   // Steel Teal — buttons, active states, safe icons
          blue:    "#6EB0DC",   // Light Blue — accents, hover states, highlights
          gold:    "#FFE082",   // Pale Gold  — warnings, suspicious RSSI
          silver:  "#B5B5B7",   // Silver     — borders, inactive icons
          danger:  "#C0392B",   // Authority red (no neon)
          success: "#1A7F5A",   // Deep executive green
          surface: "#F4F6F9",   // Page bg in light mode
          card:    "#FFFFFF",   // Card bg in light mode
          dark:    "#071829",   // Deepest dark page background
          cdark:   "#0F2744",   // Card bg in dark mode
          ndark:   "#0D3B66",   // Nav / header in dark mode (= navy)
        },
      },

      boxShadow: {
        card:    "0 1px 3px 0 rgba(13,59,102,0.08), 0 1px 2px -1px rgba(13,59,102,0.06)",
        cardmd:  "0 4px 12px 0 rgba(13,59,102,0.10), 0 2px 4px -2px rgba(13,59,102,0.08)",
        tealsm:  "0 2px 8px  0 rgba(35,91,126,0.30)",
        tealmd:  "0 4px 16px 0 rgba(35,91,126,0.40)",
      },

      animation: {
        "slide-up":  "slideUp 0.35s ease-out forwards",
        "fade-in":   "fadeIn 0.25s ease-out forwards",
        "ping-slow": "ping 2.5s cubic-bezier(0,0,0.2,1) infinite",
      },

      keyframes: {
        slideUp: {
          "0%":   { transform: "translateY(16px)", opacity: 0 },
          "100%": { transform: "translateY(0)",    opacity: 1 },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}

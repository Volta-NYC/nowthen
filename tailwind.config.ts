import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm gallery-boutique palette. The merchandise brings the color;
        // the interface stays quiet, warm and editorial.
        bone: {
          DEFAULT: "#f4efe6",
          50: "#faf7f1",
          100: "#f4efe6",
          200: "#ece4d6",
          300: "#e0d4bf",
        },
        ink: {
          DEFAULT: "#1c1814",
          soft: "#2b2520",
          muted: "#6b6157",
          faint: "#9a8f82",
        },
        brass: {
          DEFAULT: "#b08433",
          light: "#caa052",
          deep: "#8a6520",
        },
        clay: "#b9492f",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-jost)", "ui-sans-serif", "system-ui", "sans-serif"],
        script: ["var(--font-pinyon)", "cursive"],
      },
      letterSpacing: {
        widest: "0.28em",
        mega: "0.45em",
      },
      maxWidth: {
        site: "1480px",
      },
      transitionTimingFunction: {
        boutique: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 1.2s ease both",
        marquee: "marquee 38s linear infinite",
        "ken-burns": "ken-burns 9s ease-out both",
      },
    },
  },
  plugins: [],
}
export default config

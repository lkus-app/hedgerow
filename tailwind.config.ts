import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F3F4F6",
        surface: "#FFFFFF",
        lavender: "#EFE8F2",
        blush: "#F1E0ED",
        sky: "#38CCFF",
        coral: "#FF5E64",
        pink: "#FFA3CC",
        navy: "#005174",
        charcoal: "#504E57",
        butter: "#FAD869",
        ink: "#000000",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        display: ["var(--font-geologica)", "sans-serif"],
        script: ["var(--font-marker)", "cursive"],
      },
      borderRadius: {
        'tag': '6px',
        'tile': '8px',
        'card': '12px',
        'panel': '16px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lift': '0 10px 24px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'spin-around': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'shimmer-slide': 'shimmer-slide 2.5s ease-in-out infinite',
        'spin-around': 'spin-around 4s linear infinite',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'float': 'float-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

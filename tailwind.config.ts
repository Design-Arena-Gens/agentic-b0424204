import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(59, 130, 246, 0.45)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(79,70,229,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.18), transparent 42%)",
      },
    },
  },
  plugins: [],
};

export default config;

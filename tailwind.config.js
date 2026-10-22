/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0a1931",
        "navy-2": "#0f2a4a",
        blue: "#1e3a5f",
        gold: "#c9a227",
        "gold-2": "#b48f1e",
        cyan: "#0ea5e9",
        slate: "#64748b",
        line: "#e2e8f0",
      },
      fontFamily: {
        jakarta: ["var(--font-jakarta)"],
        inter: ["var(--font-inter)"],
      }
    }
  },
  plugins: []
}

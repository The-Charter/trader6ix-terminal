/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic trading colors
        bull: "var(--green)",
        bear: "var(--red)",
        // Design-token palette from the Trader6ix mobile reference —
        // these read from CSS vars so a future light-theme toggle just
        // swaps the :root values, no component changes needed.
        surface: {
          0: "var(--bg)",
          1: "var(--p1)",
          2: "var(--p2)",
          3: "var(--p3)",
        },
        border: "var(--bd)",
        accent: "var(--accent)",
        ink: {
          DEFAULT: "var(--text)",
          2: "var(--text2)",
          3: "var(--text3)",
          4: "var(--text4)",
        },
        warn: "var(--amber)",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

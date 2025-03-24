/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E8B57",
          light: "#3DAA6D",
          dark: "#1F6E45",
        },
        background: {
          DEFAULT: "#000017",
          light: "#000030",
          dark: "#000010",
        },
        text: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          dark: "#E0E0E0",
        },
      },
      backgroundColor: {
        page: "#000017",
        card: "#000025",
        input: "#000035",
      },
      textColor: {
        default: "#FFFFFF",
        muted: "#CCCCCC",
        inverted: "#000017",
      },
      borderColor: {
        default: "#2E8B57",
      },
      gradientColorStops: {
        "primary-start": "#2E8B57",
        "primary-end": "#1F6E45",
      },
    },
  },
  plugins: [],
};

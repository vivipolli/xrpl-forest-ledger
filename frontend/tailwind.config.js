/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#556B2F", // verde-musgo como cor primária
          light: "#6a8439",
          dark: "#445624",
        },
        secondary: {
          DEFAULT: "#FFA500", // laranja-solar como cor secundária
          light: "#ffb733",
          dark: "#cc8400",
        },
        background: {
          DEFAULT: "#3A3A3A", // cinza-chumbo como fundo
          light: "#4a4a4a",
          dark: "#2a2a2a",
        },
        text: {
          DEFAULT: "#E0C9A6", // bege-areia para textos
          light: "#e8d7bd",
          dark: "#c9b08f",
        },
        accent: {
          DEFAULT: "#007BFF", // azul-eletrico como cor auxiliar/accent
          light: "#3395ff",
          dark: "#0062cc",
        },
        // Mantendo a cor primária original para compatibilidade
        "primary-legacy": {
          DEFAULT: "#45803B",
          light: "#569c49",
          dark: "#386832",
        },
      },
      backgroundColor: {
        page: "#ffff", // cinza-chumbo para fundo de página
        card: "#ffff", // versão mais clara do cinza-chumbo para cards
        input: "#4a4a4a", // versão mais clara do cinza-chumbo para inputs
      },
      textColor: {
        default: "#E0C9A6", // bege-areia como texto padrão
        muted: "#c9b08f", // versão mais escura do bege-areia para texto secundário
        inverted: "#3A3A3A", // cinza-chumbo para texto em fundos claros
      },
      borderColor: {
        default: "#5a5a5a", // versão mais clara do cinza-chumbo para bordas
      },
      gradientColorStops: {
        "terra-start": "#556B2F", // verde-musgo
        "terra-end": "#FFA500", // laranja-solar
      },
    },
  },
  plugins: [],
};

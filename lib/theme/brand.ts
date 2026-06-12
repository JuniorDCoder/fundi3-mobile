// Mirrors frontend/styles/brand.ts — keep in sync with CLAUDE.md.
// Always import colors/fonts from here. Never hardcode hex values in screens.

export const brand = {
  green: {
    50: "#E1F5EE",
    100: "#9FE1CB",
    400: "#1D9E75",
    600: "#0F6E56",
    800: "#085041",
    900: "#04342C",
  },
  amber: {
    50: "#FAEEDA",
    100: "#FAC775",
    400: "#EF9F27",
    600: "#BA7517",
    800: "#633806",
  },
  dark: {
    bg: "#0A0F0E",
    surface: "#111915",
    border: "#1E2E28",
    muted: "#EBD9D2", // lighter than web's #4A6358 for better contrast on mobile
  },
  white: "#F5FAF7",
} as const;

export const fonts = {
  heading: "SpaceGrotesk_500Medium",
  headingSemibold: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  mono: "JetBrainsMono_400Regular",
} as const;

// React Native has no `bg-white/5`-style alpha utilities — these helpers give
// the same glassmorphism feel used across the web app's GlassCard.
export const glass = {
  surface: "rgba(255, 255, 255, 0.05)",
  border: "rgba(255, 255, 255, 0.1)",
  borderHover: "rgba(255, 255, 255, 0.2)",
} as const;

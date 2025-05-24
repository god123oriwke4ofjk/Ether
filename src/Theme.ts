import { convertCssRgbToHex, hexToRgb } from "./utils/colors";
import { z } from "zod";
import { defaultThemeName } from "./data/THEMES";
import THEMES from "./data/THEMES";

export const THEME_LS_KEY = "theme";

export type Theme = {
  "fg color": string;
  "bg color": string;
  "main accent": string;
  "accent 1": string;
  "accent 2": string;
  "accent 3": string;
  "accent 4": string;
  "accent 5": string;
  "panel opacity": number;
};

const hex = z.custom((val) => {
  return /^#([A-Fa-f0-9]{6})$/.test(val as string);
}, "Encountered invalid hex code");
const ThemeSchema = z
  .object({
    "fg color": hex,
    "bg color": hex,
    "main accent": hex,
    "accent 1": hex,
    "accent 2": hex,
    "accent 3": hex,
    "accent 4": hex,
    "accent 5": hex,
    "panel opacity": z
      .number()
      .min(0, "Panel opacity must be between 0 and 1.")
      .max(1, "Panel opacity must be between 0 and 1.")
  })
  .strict("Encountered unknown theme variable");

export function getTheme(): Theme {
  const lsItem = localStorage.getItem(THEME_LS_KEY);
  if (lsItem) return JSON.parse(lsItem);

  const defaultTheme = THEMES[defaultThemeName]?.theme || {
    "bg color": "#2e3440",
    "fg color": "#eceff4",
    "main accent": "#5e81ac",
    "accent 1": "#b48ead",
    "accent 2": "#a3be8c",
    "accent 3": "#d08770",
    "accent 4": "#ebcb8b",
    "accent 5": "#8fbcbb",
    "panel opacity": 0.8
  };

  localStorage.setItem(THEME_LS_KEY, JSON.stringify(defaultTheme));
  return defaultTheme;
}

export function saveTheme(data: any): void {
  validateTheme(data);
  localStorage.setItem(THEME_LS_KEY, JSON.stringify(data));
}

export function setTheme(theme: Theme): void {
  const entries = Object.entries(theme);

  for (const [key, value] of entries) {
    if (!value) continue;
    switch (key) {
      case "bg color": {
        document.documentElement.style.setProperty(
          "--main-bg-color",
          hexToRgb(value as string)
        );
        break;
      }
      case "fg color": {
        document.documentElement.style.setProperty(
          "--main-fg-color",
          hexToRgb(value as string)
        );
        const imageBoxBg = document.querySelector(
          ".image-border .squiggly"
        ) as HTMLElement;
        const url = window.getComputedStyle(imageBoxBg).backgroundImage;
        const hex = value as string;
        const newUrl = url.replace(/%23([0-9a-fA-F]{6})/, `%23${hex.slice(1)}`);
        if (newUrl === url) continue;
        imageBoxBg.style.setProperty("background-image", newUrl);
        break;
      }
      case "main accent": {
        document.documentElement.style.setProperty(
          "--main-accent",
          hexToRgb(value as string)
        );
        const linkBoxBg = document.querySelector(
          ".links-section .squiggly"
        ) as HTMLElement;
        const url = window.getComputedStyle(linkBoxBg).backgroundImage;
        const hex = value as string;
        const newUrl = url.replace(/%23([0-9a-fA-F]{6})/, `%23${hex.slice(1)}`);
        if (newUrl === url) break;
        linkBoxBg.style.setProperty("background-image", newUrl);
        break;
      }
      case "accent 1": {
        document.documentElement.style.setProperty(
          "--accent-1",
          hexToRgb(value as string)
        );
        break;
      }
      case "accent 2": {
        document.documentElement.style.setProperty(
          "--accent-2",
          hexToRgb(value as string)
        );
        break;
      }
      case "accent 3": {
        document.documentElement.style.setProperty(
          "--accent-3",
          hexToRgb(value as string)
        );
        break;
      }
      case "accent 4": {
        document.documentElement.style.setProperty(
          "--accent-4",
          hexToRgb(value as string)
        );
        break;
      }
      case "accent 5": {
        document.documentElement.style.setProperty(
          "--accent-5",
          hexToRgb(value as string)
        );
        break;
      }
      case "panel opacity": {
        document.documentElement.style.setProperty(
          "--panel-opacity",
          value as string
        );
      }
    }
  }
}

export function refreshTheme(theme: Theme) {
  setTheme(theme);
}

export function validateTheme(data: any): data is Theme {
  ThemeSchema.parse(data);
  return true;
}

// HMR: Reapply theme when this module changes
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    const theme = getTheme();
    refreshTheme(theme);
  });
}
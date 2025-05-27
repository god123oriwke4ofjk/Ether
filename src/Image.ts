import { z } from "zod";
import { themes, defaultThemeName } from "./data/THEMES";
import wallbash from "./wallbashTheme";

export const IMAGE_LS_KEY = "image";
export const THEME_MODE_LS_KEY = "themeMode";

export interface ImageState {
  image: string | null;
  "position x": string;
  "position y": string;
}

const percentage = z.custom<`${number}%`>((val) => {
  return /^\d+%$/.test(val as string);
}, "Not a valid percentage");
const ImageStateSchema = z.object({
  image: z.string(),
  "position x": percentage,
  "position y": percentage,
});

const imageEl = document.querySelector(".image") as HTMLElement;
const defaultImage = `url(${import.meta.env.BASE_URL}main-image.jpg)`;
let currentImageSrc = null; // Track current image to skip duplicates

export function getImage(): ImageState {
  const lsItem = localStorage.getItem(IMAGE_LS_KEY);
  if (lsItem) return JSON.parse(lsItem);

  const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
  const imageState = mode === "themes" ? themes[defaultThemeName]?.image : wallbash.image;

  localStorage.setItem(IMAGE_LS_KEY, JSON.stringify(imageState));
  return imageState;
}

export function setImage(imageState: ImageState) {
  const src = imageState.image?.match(/url\((.*?)\)/)?.[1] || defaultImage;
  if (src === currentImageSrc) {
    console.log(`[Image] Skipped setting image (already loaded: ${src})`);
    return;
  }

  const img = new Image();
  img.src = src;
  img.onload = () => {
    imageEl.style.setProperty("background-image", imageState.image || defaultImage);
    imageEl.style.setProperty("background-position-x", imageState["position x"]);
    imageEl.style.setProperty("background-position-y", imageState["position y"]);
    currentImageSrc = src;
    console.log(`[Image] Loaded image: ${src}`);
  };
  img.onerror = () => {
    console.warn(`[Image] Failed to load ${src}, using default image`);
    imageEl.style.setProperty("background-image", defaultImage);
    imageEl.style.setProperty("background-position-x", imageState["position x"]);
    imageEl.style.setProperty("background-position-y", imageState["position y"]);
    currentImageSrc = defaultImage;
  };
}

export function refreshImage(image: ImageState) {
  setImage(image);
}

export function validateImageState(data: any): data is ImageState {
  ImageStateSchema.parse(data);
  return true;
}

export function saveImageState(data: any) {
  validateImageState(data);
  localStorage.setItem(IMAGE_LS_KEY, JSON.stringify(data));
}

if (import.meta.hot) {
  import.meta.hot.accept(["./data/THEMES"], () => {
    const image = getImage();
    refreshImage(image);
    console.log(`HMR: Reapplied image for theme ${defaultThemeName}`);
  });
}

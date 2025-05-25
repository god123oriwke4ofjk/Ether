import { setTheme, saveTheme } from "../Theme";
import { setImage, saveImageState } from "../Image";

export const defaultThemeName = "Nordic Blue";

const everforestDark = {
  theme: {
    "bg color": "#2d353b",
    "fg color": "#d3c6aa",
    "main accent": "#8A2C2A",
    "accent 1": "#a7c080",
    "accent 2": "#e67e80",
    "accent 3": "#7fbbb3",
    "accent 4": "#d699b6",
    "accent 5": "#dbbc7f",
    "panel opacity": 0.5,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}main-image.jpg)`,
    "position x": "50%",
    "position y": "50%",
  },
};

const blackAndWhite = {
  theme: {
    "bg color": "#000000",
    "fg color": "#ffffff",
    "main accent": "#8C001A",
    "accent 1": "#a7c080",
    "accent 2": "#e67e80",
    "accent 3": "#7fbbb3",
    "accent 4": "#d699b6",
    "accent 5": "#c6a0f6",
    "panel opacity": 0.3,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}akira-explosion.jpg)`,
    "position x": "52%",
    "position y": "50%",
  },
};

const gruvbox = {
  theme: {
    "bg color": "#282828",
    "fg color": "#e2cca9",
    "main accent": "#db4740",
    "accent 1": "#8bba7f",
    "accent 2": "#f28534",
    "accent 3": "#80aa9e",
    "accent 4": "#d3869b",
    "accent 5": "#b0b846",
    "panel opacity": 0.8,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}gruvbox_image31.png)`,
    "position x": "30%",
    "position y": "50%",
  },
};

const nord = {
  theme: {
    "bg color": "#2e3440",
    "fg color": "#eceff4",
    "main accent": "#5e81ac",
    "accent 1": "#b48ead",
    "accent 2": "#a3be8c",
    "accent 3": "#d08770",
    "accent 4": "#ebcb8b",
    "accent 5": "#8fbcbb",
    "panel opacity": 0.8,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}astero-20210517a.jpg)`,
    "position x": "35%",
    "position y": "50%",
  },
};

const catppuccin = {
  theme: {
    "bg color": "#24273a",
    "fg color": "#cad3f5",
    "main accent": "#f5bde6",
    "accent 1": "#8aadf4",
    "accent 2": "#8bd5ca",
    "accent 3": "#f5a97f",
    "accent 4": "#c6a0f6",
    "accent 5": "#a6da95",
    "panel opacity": 0.9,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}ilya-kuvshinov-untitled-1.jpg)`,
    "position x": "50%",
    "position y": "50%",
  },
};

const dracula = {
  theme: {
    "bg color": "#282a36",
    "fg color": "#f8f8f2",
    "main accent": "#bd93f9",
    "accent 1": "#8be9fd",
    "accent 2": "#ffb86c",
    "accent 3": "#ff79c6",
    "accent 4": "#f1fa8c",
    "accent 5": "#ff5555",
    "panel opacity": 0.8,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}samurai.jpg)`,
    "position x": "50%",
    "position y": "50%",
  },
};

const themes = {
  "Everforest Dark": everforestDark,
  "Vanta Black": blackAndWhite,
  Gruvbox: gruvbox,
  "Nordic Blue": nord,
  Catppuccin: catppuccin,
  Dracula: dracula,
};

if (!themes[defaultThemeName]) {
  console.error(`Invalid defaultThemeName: ${defaultThemeName}. Available themes: ${Object.keys(themes).join(", ")}`);
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    localStorage.removeItem("theme");
    localStorage.removeItem("image");
    localStorage.setItem("themeMode", "themes");

    const { theme, image } = themes[defaultThemeName] || themes.Nord;
    setTheme(theme);
    saveTheme(theme);
    setImage(image);
    saveImageState(image);

    const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
    if (select) {
      select.value = defaultThemeName;
      select.disabled = false;
    }

    console.log(`HMR: Applied theme ${defaultThemeName}`);
  });
}

export { themes };

const wallbash = {
  theme: {
    "bg color": "#1a1a1a",
    "fg color": "#f5f5f5",
    "main accent": "#ff5555",
    "accent 1": "#55ff55",
    "accent 2": "#5555ff",
    "accent 3": "#ffff55",
    "accent 4": "#ff55ff",
    "accent 5": "#55ffff",
    "panel opacity": 0.7,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}wallbash-image.jpg)`,
    "position x": "50%",
    "position y": "50%",
  },
};

export const wallbashThemePath = `${import.meta.env.BASE_URL}wallbash-image.jpg`;

export default wallbash;

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Handle HMR updates if needed
  });
}

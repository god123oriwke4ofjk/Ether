const wallbash = {
  theme: {
    "bg color": "#ffffff",
    "fg color": "#000000",
    "main accent": "#ff5555",
    "accent 1": "#55ff55",
    "accent 2": "#5555ff",
    "accent 3": "#ffff55",
    "accent 4": "#ff55ff",
    "accent 5": "#55ffff",
    "panel opacity": 0.7,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}ilya-kuvshinov-untitled-1.jpg)`,
    "position x": "50%",
    "position y": "50%",
  },
};

export default wallbash;

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Handle HMR updates if needed
  });
}

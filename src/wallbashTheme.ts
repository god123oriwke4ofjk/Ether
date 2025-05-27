import { setTheme, saveTheme } from "./Theme";
import { setImage, saveImageState } from "./Image";

const wallbash = {
  theme: {
    "bg color": "#101419",
    "fg color": "#FFFFFF",
    "main accent": "#CCFFE3",
    "accent 1": "#AAF0C9",
    "accent 2": "#9AE6BC",
    "accent 3": "#CCDFFF",
    "accent 4": "#CCE0FF",
    "accent 5": "#AAC6F0",
    "panel opacity": 0.7,
  },
  image: {
    image: `url(${import.meta.env.BASE_URL}wall.set.png)`,
    "position x": "50%",
    "position y": "50%",
  },
};

export default wallbash;

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    const currentMode = localStorage.getItem("themeMode") || "themes";
    if (currentMode !== "wallbash") {
      console.log("HMR: Skipped Wallbash theme update (not in wallbash mode)");
      import.meta.hot.invalidate();
      return;
    }

    setTheme(wallbash.theme);
    saveTheme(wallbash.theme);
    setImage(wallbash.image);
    saveImageState(wallbash.image);

    const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
    if (select) {
      select.value = "custom";
      select.disabled = true;
    }

    const themeModeSection = document.getElementById("theme-mode-settings") as HTMLElement;
    if (themeModeSection) {
      const inputs = themeModeSection.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.checked = input.value === "wallbash";
      });
      const msgEl = themeModeSection.querySelector(".msg") as HTMLElement;
      if (msgEl) {
        msgEl.textContent = "Wallbash theme is loaded";
        msgEl.classList.remove("error", "hide");
        setTimeout(() => {
          msgEl.classList.add("hide");
        }, 3000);
      }
    }

    console.log("HMR: Applied Wallbash theme");
  });
}

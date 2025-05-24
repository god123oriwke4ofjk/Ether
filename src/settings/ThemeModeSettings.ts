import { SettingsSection } from "./SettingsSection";
import DomRender from "../DomRender";
import { refreshTheme, saveTheme } from "../Theme";
import { refreshImage, saveImageState } from "../Image";
import THEMES, { defaultThemeName } from "../data/THEMES";
import wallbash from "../wallbashTheme";

const THEME_MODE_LS_KEY = "themeMode";

export default function initThemeModeSettings() {
  const themeModeSection = new SettingsSection<string>({
    title: THEME_MODE_LS_KEY,
    state: localStorage.getItem(THEME_MODE_LS_KEY) || "themes",
    sectionEl: document.getElementById("theme-mode-settings") as HTMLElement,
    onSave: (data: string) => {
      localStorage.setItem(THEME_MODE_LS_KEY, data);
      const { theme, image } = data === "themes" ? THEMES[defaultThemeName] : wallbash;
      saveTheme(theme);
      refreshTheme(theme);
      saveImageState(image);
      refreshImage(image);
    },
    render: function () {
      const sectionEl = this.sectionEl;
      const inputs = sectionEl.querySelectorAll('input[name="themeMode"]');
      inputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          this.state = (e.target as HTMLInputElement).value;
        });
        if (input.value === this.state) {
          (input as HTMLInputElement).checked = true;
        }
      });
    },
    rerender: function () {
      const inputs = this.sectionEl.querySelectorAll('input[name="themeMode"]');
      inputs.forEach((input) => {
        (input as HTMLInputElement).checked = input.value === this.state;
      });
    }
  });

  // HMR: Reapply mode, theme, and image when this module changes
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      const { theme, image } = mode === "themes" ? THEMES[defaultThemeName] : wallbash;
      refreshTheme(theme);
      refreshImage(image);
      themeModeSection.state = mode;
      themeModeSection.rerender();
    });
  }

  return themeModeSection;
}
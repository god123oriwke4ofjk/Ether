import SettingsSection from "./SettingsSection";
import { refreshTheme, saveTheme } from "../Theme";
import { refreshImage, saveImageState } from "../Image";
import { themes, defaultThemeName } from "../data/THEMES";
import wallbash from "../wallbashTheme";

const THEME_MODE_LS_KEY = "themeMode";

export default function initThemeModeSettings() {
  const themeModeSection = new SettingsSection<string>({
    title: THEME_MODE_LS_KEY,
    state: localStorage.getItem(THEME_MODE_LS_KEY) || "themes",
    sectionEl: document.getElementById("theme-mode-settings") as HTMLElement,
    onSave: (data: string) => {
      try {
        localStorage.setItem(THEME_MODE_LS_KEY, data);
        const { theme, image } = data === "themes" ? themes[defaultThemeName] : wallbash;
        saveTheme(theme);
        refreshTheme(theme);
        saveImageState(image);
        refreshImage(image);
        // Update theme dropdown
        const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
        if (select) {
          select.value = data === "themes" ? defaultThemeName : "custom";
          select.disabled = data === "wallbash";
        }
        themeModeSection.displaySuccessMsg();
      } catch (e) {
        themeModeSection.displayFailedMsg("Failed to save theme mode");
      }
    },
    render: function () {
      const inputs = this.sectionEl.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          this.state = (e.target as HTMLInputElement).value;
        });
        input.checked = input.value === this.state;
      });
    },
    rerender: function () {
      const inputs = this.sectionEl.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.checked = input.value === this.state;
      });
    }
  });

  // HMR: Reapply mode, theme, and image
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      const { theme, image } = mode === "themes" ? themes[defaultThemeName] : wallbash;
      refreshTheme(theme);
      refreshImage(image);
      themeModeSection.state = mode;
      themeModeSection.rerender();
      const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
      if (select) {
        select.value = mode === "themes" ? defaultThemeName : "custom";
        select.disabled = mode === "wallbash";
      }
    });
  }

  return themeModeSection;
}

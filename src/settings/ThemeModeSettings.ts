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
        const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
        if (select) {
          select.value = data === "themes" ? defaultThemeName : "custom";
          select.disabled = data === "wallbash";
        }
        const message = data === "wallbash" ? "Wallbash theme is loaded" : "Default theme is loaded";
        const msgEl = themeModeSection.sectionEl.querySelector(".msg") as HTMLElement;
        if (msgEl) {
          msgEl.textContent = message;
          msgEl.classList.remove("error", "hide");
          setTimeout(() => {
            msgEl.classList.add("hide");
          }, 3000);
        }
      } catch (e) {
        console.error("Failed to save theme mode:", e);
        themeModeSection.displayFailedMsg("Failed to save theme mode");
      }
    },
    render: function () {
      const sectionEl = this.sectionEl;
      sectionEl.innerHTML = `
        <h3 class="settings-title">Theme Mode</h3>
        <div class="input-group">
          <label>
            <input type="radio" name="themeMode" value="themes" ${this.state === "themes" ? "checked" : ""}>
            Themes
          </label>
          <label>
            <input type="radio" name="themeMode" value="wallbash" ${this.state === "wallbash" ? "checked" : ""}>
            Wallbash
          </label>
        </div>
        <div class="btn-ctn">
          <button class="save-btn" type="submit">Save</button>
          <span class="reset-btn" aria-label="reset">Reset</span>
        </div>
        <p class="msg"></p>
      `;

      const inputs = sectionEl.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          this.state = (e.target as HTMLInputElement).value;
          const message = this.state === "wallbash" ? "Wallbash theme selected" : "Default theme selected";
          const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
          if (msgEl) {
            msgEl.textContent = message;
            msgEl.classList.remove("error", "hide");
            setTimeout(() => {
              msgEl.classList.add("hide");
            }, 3000);
          }
        });
      });

      const saveBtn = sectionEl.querySelector(".save-btn") as HTMLButtonElement;
      saveBtn.addEventListener("click", () => {
        this.onSave(this.state);
      });

      const resetBtn = sectionEl.querySelector(".reset-btn") as HTMLElement;
      resetBtn.addEventListener("click", () => {
        this.state = "themes";
        this.rerender();
        this.onSave("themes");
        const msgEl = themeModeSection.sectionEl.querySelector(".msg") as HTMLElement;
        if (msgEl) {
          msgEl.textContent = "Theme reset to default";
          msgEl.classList.remove("error", "hide");
          setTimeout(() => {
            msgEl.classList.add("hide");
          }, 3000);
        }
      });
    },
    rerender: function () {
      const inputs = this.sectionEl.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.checked = input.value === this.state;
      });
      const message = this.state === "wallbash" ? "Wallbash theme is loaded" : "Default theme is loaded";
      const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
      if (msgEl) {
        msgEl.textContent = message;
        msgEl.classList.remove("error", "hide");
        setTimeout(() => {
          msgEl.classList.add("hide");
        }, 3000);
      }
    }
  });

  if (import.meta.hot) {
    import.meta.hot.accept(["../data/THEMES", "../wallbashTheme"], () => {
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      const { theme, image } = mode === "themes" ? themes[defaultThemeName] : wallbash;
      if (mode === "themes") {
        refreshTheme(themes[defaultThemeName].theme);
        refreshImage(themes[defaultThemeName].image);
      } else {
        refreshTheme(theme);
        refreshImage(image);
      }
      themeModeSection.state = mode;
      themeModeSection.rerender();
      const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
      if (select) {
        select.value = mode === "themes" ? defaultThemeName : "custom";
        select.disabled = mode === "wallbash";
      }
      console.log(`HMR: ThemeModeSettings updated to ${mode === "themes" ? defaultThemeName : "wallbash"}`);
    });
  }

  return themeModeSection;
}

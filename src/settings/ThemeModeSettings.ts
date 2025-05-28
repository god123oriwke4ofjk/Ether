import SettingsSection from "./SettingsSection";
import { refreshTheme, saveTheme } from "../Theme";
import { refreshImage, saveImageState } from "../Image";
import { themes, defaultThemeName } from "../data/THEMES";
import wallbash from "../wallbashTheme";
import { promises as fs } from "fs";
import { resolve } from "path";

const THEME_MODE_LS_KEY = "themeMode";
const STATERC_PATH = resolve(process.env.HOME, ".local/state/hyde/staterc");

async function getHydeTheme() {
  try {
    const content = await fs.readFile(STATERC_PATH, "utf-8");
    const match = content.match(/^HYDE_THEME="([^"]+)"/m);
    const themeName = match ? match[1] : null;
    console.log(`[ThemeModeSettings] Read HYDE_THEME="${themeName}" from ${STATERC_PATH}`);
    return themeName;
  } catch (err) {
    console.error(`[ThemeModeSettings] Failed to read ${STATERC_PATH}:`, err);
    return null;
  }
}

export default function initThemeModeSettings() {
  const themeModeSection = new SettingsSection<string>({
    title: THEME_MODE_LS_KEY,
    state: localStorage.getItem(THEME_MODE_LS_KEY) || "themes",
    sectionEl: document.getElementById("theme-mode-settings") as HTMLElement,
    onSave: (data: string) => {
      try {
        console.log(`[ThemeModeSettings] Saving theme mode: ${data}`);
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
        console.error("[ThemeModeSettings] Failed to save theme mode:", e);
        themeModeSection.displayFailedMsg("Failed to save theme mode");
      }
    },
    render: function () {
      console.log(`[ThemeModeSettings] Rendering with state: ${this.state}`);
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
          console.log(`[ThemeModeSettings] Radio changed to: ${this.state}`);
          const message = this.state === "wallbash" ? "Wallbash theme selected" : "Themes mode selected";
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
        console.log(`[ThemeModeSettings] Save button clicked, state: ${this.state}`);
        this.onSave(this.state);
      });

      const resetBtn = sectionEl.querySelector(".reset-btn") as HTMLElement;
      resetBtn.addEventListener("click", () => {
        console.log("[ThemeModeSettings] Reset button clicked");
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
      console.log(`[ThemeModeSettings] Rerendering with state: ${this.state}`);
      const inputs = this.sectionEl.querySelectorAll('input[name="themeMode"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        input.checked = input.value === this.state;
      });
      const message = this.state === "wallbash" ? "Wallbash theme is loaded" : "Themes mode is loaded";
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
    import.meta.hot.accept(["../data/THEMES", "../wallbashTheme"], async (newModules) => {
      console.log("[ThemeModeSettings] HMR triggered for THEMES or wallbashTheme");
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      let themeName = defaultThemeName;

      if (mode === "themes") {
        const hydeTheme = await getHydeTheme();
        if (hydeTheme && Object.keys(themes).includes(hydeTheme)) {
          console.log(`[ThemeModeSettings] Detected HYDE_THEME="${hydeTheme}" in staterc, switching to theme`);
          themeName = hydeTheme;
          const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
          if (select) {
            select.value = themeName;
            select.disabled = false;
          }
          const msgEl = themeModeSection.sectionEl.querySelector(".msg") as HTMLElement;
          if (msgEl) {
            msgEl.textContent = `Switched to ${themeName} theme from HYDE_THEME`;
            msgEl.classList.remove("error", "hide");
            setTimeout(() => {
              msgEl.classList.add("hide");
            }, 3000);
          }
        } else if (hydeTheme) {
          console.log(`[ThemeModeSettings] HYDE_THEME="${hydeTheme}" not found in THEMES, using default`);
        }
      }

      const { theme, image } = mode === "themes" ? themes[themeName] : wallbash;
      refreshTheme(theme);
      refreshImage(image);
      saveTheme(theme);
      saveImageState(image);
      themeModeSection.state = mode;
      themeModeSection.rerender();

      const select = document.querySelector('select[name="load theme"]') as HTMLSelectElement;
      if (select) {
        select.value = mode === "themes" ? themeName : "custom";
        select.disabled = mode === "wallbash";
      }
      console.log(`HMR: ThemeModeSettings updated to ${mode === "themes" ? themeName : "wallbash"}`);
    });
  }

  return themeModeSection;
}

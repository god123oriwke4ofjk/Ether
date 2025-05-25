// /src/settings/ThemeModeSettings.ts
import { ThemeState, THEME_LS_KEY, saveThemeState, refreshTheme } from "../Theme";
import { SettingsSectionWithChildren } from "./SettingsSection";
import { Component } from "./settingsTypes";

export default function initThemeModeSettings(themeState: ThemeState) {
  const themeModeSection = new SettingsSectionWithChildren<ThemeState>({
    title: "Theme Mode",
    state: themeState,
    sectionEl: document.getElementById("theme-mode-settings") as HTMLElement,
    children: [
      {
        render: function () {
          const sectionEl = document.getElementById("theme-mode-settings") as HTMLElement;
          const radios = sectionEl.querySelectorAll("input[type='radio']");
          radios.forEach((radio) => {
            radio.addEventListener("change", (e) => {
              const target = e.target as HTMLInputElement;
              themeModeSection.state.mode = target.value;
              const msg =
                target.value === "wallbash"
                  ? "Wallbash theme is loaded"
                  : "Custom theme is loaded";
              themeModeSection.displaySuccessMsg(msg);
              // Disable/enable theme dropdown
              const themeSelect = document.getElementById("theme-settings")?.querySelector("select") as HTMLSelectElement;
              if (themeSelect) {
                themeSelect.disabled = target.value === "wallbash";
              }
            });
          });
        },
        rerender: function () {
          const sectionEl = document.getElementById("theme-mode-settings") as HTMLElement;
          const msgEl = sectionEl.querySelector(".msg") as HTMLElement;
          msgEl.textContent = "";
        },
      },
    ],
    onSave: (data: ThemeState) => {
      saveThemeState(data);
      refreshTheme(data);
      const msg = data.mode === "wallbash" ? "Wallbash theme is loaded" : "Custom theme is loaded";
      themeModeSection.displaySuccessMsg(msg);
    },
    onReset: () => {
      themeModeSection.state.mode = "default"; // Adjust default mode
      saveThemeState(themeModeSection.state);
      refreshTheme(themeModeSection.state);
      themeModeSection.displaySuccessMsg("Theme mode reset to default");
    },
  });

  return themeModeSection;
}

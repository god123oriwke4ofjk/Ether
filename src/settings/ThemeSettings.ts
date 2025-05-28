import { StringKeyObj } from "../../types/interfaces";
import { themes, defaultThemeName } from "../data/THEMES";
import DomRender from "../DomRender";
import { getImage, ImageState, refreshImage, saveImageState } from "../Image";
import {
  getTheme,
  refreshTheme,
  saveTheme,
  Theme,
  THEME_LS_KEY,
  THEME_MODE_LS_KEY
} from "../Theme";
import InputGroup from "./InputGroup";
import SettingsSection, {
  SettingsSectionWithChildren
} from "./SettingsSection";

type ThemeKey = keyof typeof themes;

export default function (
  theme: Theme,
  imageSection: SettingsSection<ImageState>
) {
  const themeSection = new SettingsSectionWithChildren({
    title: THEME_LS_KEY,
    state: theme,
    sectionEl: document.getElementById("theme-settings") as HTMLElement,
    children: [
      {
        render: function () {
          console.log("[ThemeSettings] Rendering select");
          const selectEl = document.querySelector(
            "#theme-settings select"
          ) as HTMLSelectElement;
          selectEl.innerHTML = "";
          const customOption = DomRender.option({
            text: "Custom",
            value: "custom"
          });
          selectEl.append(customOption);

          for (const key of Object.keys(themes)) {
            const optionEl = DomRender.option({
              text: key,
              value: key
            });
            selectEl.append(optionEl);
          }
          const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
          selectEl.value = mode === "themes" ? defaultThemeName : "custom";
          selectEl.disabled = mode === "wallbash";

          selectEl.addEventListener("change", () => {
            console.log(`[ThemeSettings] Theme select changed to: ${selectEl.value}`);
            const value = selectEl.value as ThemeKey | "custom";
            let selectedTheme;
            if (value === "custom") {
              selectedTheme = {
                theme: getTheme(),
                image: getImage()
              };
            } else {
              selectedTheme = themes[value];
              localStorage.setItem(THEME_MODE_LS_KEY, "themes");
            }
            refreshTheme(selectedTheme.theme);
            refreshImage(selectedTheme.image);
            themeSection.state = selectedTheme.theme;
            imageSection.state = selectedTheme.image;
            themeSection.rerender();
            imageSection.rerender();
            if (value !== "custom") {
              localStorage.setItem(THEME_LS_KEY, JSON.stringify(selectedTheme.theme));
              localStorage.setItem("image", JSON.stringify(selectedTheme.image));
            }
          });
        },
        rerender: () => {
          console.log("[ThemeSettings] Rerendering select");
          const selectEl = document.querySelector(
            "#theme-settings select"
          ) as HTMLSelectElement;
          const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
          const currentTheme = getTheme();
          const themeKey = Object.keys(themes).find(
            (key) => JSON.stringify(themes[key as ThemeKey].theme) === JSON.stringify(currentTheme)
          ) || "custom";
          selectEl.value = mode === "themes" ? themeKey : "custom";
          selectEl.disabled = mode === "wallbash";
        }
      },
      new InputGroup({
        wrapperEl: document.querySelector(
          "#theme-settings .input-group"
        ) as HTMLElement,
        updateState: (e: Event) => {
          console.log("[ThemeSettings] Input group updated");
          const selectEl = document.querySelector(
            "#theme-settings select"
          ) as HTMLSelectElement;
          selectEl.value = "custom";

          const target = e.target as HTMLInputElement;
          const key = target.name as keyof Theme;
          if (key === "panel opacity")
            themeSection.state[key] = Number(target.value);
          else themeSection.state[key] = target.value;
        },
        getState: (): StringKeyObj => themeSection.state,
        id: THEME_LS_KEY
      })
    ],
    onSave: () => {
      console.log("[ThemeSettings] Saving theme");
      saveTheme(themeSection.state);
      saveImageState(imageSection.state);
      refreshTheme(themeSection.state);
      const selectEl = document.querySelector(
        "#theme-settings select"
      ) as HTMLSelectElement;
      selectEl.value = "custom";
      localStorage.setItem(THEME_MODE_LS_KEY, "themes");
    }
  });

  if (import.meta.hot) {
    import.meta.hot.accept(["../data/THEMES", "../wallbashTheme"], () => {
      console.log("[ThemeSettings] HMR triggered for THEMES or wallbashTheme");
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      const selectedTheme = mode === "themes" ? themes[defaultThemeName] : themes[defaultThemeName];
      refreshTheme(selectedTheme.theme);
      refreshImage(selectedTheme.image);
      themeSection.state = selectedTheme.theme;
      imageSection.state = selectedTheme.image;
      themeSection.rerender();
      imageSection.rerender();

      const selectEl = document.querySelector(
        "#theme-settings select"
      ) as HTMLSelectElement;
      if (selectEl) {
        selectEl.innerHTML = "";
        const customOption = DomRender.option({
          text: "Custom",
          value: "custom"
        });
        selectEl.append(customOption);
        for (const key of Object.keys(themes)) {
          const optionEl = DomRender.option({
            text: key,
            value: key
          });
          selectEl.append(optionEl);
        }
        const currentTheme = getTheme();
        const themeKey = Object.keys(themes).find(
          (key) => JSON.stringify(themes[key as ThemeKey].theme) === JSON.stringify(currentTheme)
        ) || "custom";
        selectEl.value = mode === "themes" ? themeKey : "custom";
        selectEl.disabled = mode === "wallbash";
      }
      console.log(`HMR: ThemeSettings updated to ${mode === "themes" ? defaultThemeName : "custom"}`);
    });
  }

  return themeSection;
}

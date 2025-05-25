import { StringKeyObj } from "../../types/interfaces";
import { themes, defaultThemeName } from "../data/THEMES";
import wallbash from "../wallbashTheme";
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
            const selectedTheme =
              selectEl.value === "custom"
                ? {
                    theme: getTheme(),
                    image: getImage()
                  }
                : themes[selectEl.value];
            refreshTheme(selectedTheme.theme);
            refreshImage(selectedTheme.image);
            themeSection.state = selectedTheme.theme;
            imageSection.state = selectedTheme.image;
            themeSection.rerender();
            imageSection.rerender();
          });
        },
        rerender: () => {
          const selectEl = document.querySelector(
            "#theme-settings select"
          ) as HTMLSelectElement;
          const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
          selectEl.value = mode === "themes" ? defaultThemeName : "custom";
          selectEl.disabled = mode === "wallbash";
        }
      },
      new InputGroup({
        wrapperEl: document.querySelector(
          "#theme-settings .input-group"
        ) as HTMLElement,
        updateState: (e: Event) => {
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
      saveTheme(themeSection.state);
      saveImageState(imageSection.state);
      refreshTheme(themeSection.state);
    }
  });

  // HMR: Reapply theme, image, and update dropdown when this module or THEMES.ts changes
  if (import.meta.hot) {
    import.meta.hot.accept(["../data/THEMES"], () => {
      const mode = localStorage.getItem(THEME_MODE_LS_KEY) || "themes";
      const selectedTheme = mode === "themes" ? themes[defaultThemeName] : wallbash;
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
        selectEl.value = mode === "themes" ? defaultThemeName : "custom";
        selectEl.disabled = mode === "wallbash";
      }
      console.log(`HMR: ThemeSettings updated to ${defaultThemeName}`);
    });
  }

  return themeSection;
}

import { StringKeyObj } from "../../types/interfaces";
import THEMES from "../data/THEMES";
import DomRender from "../DomRender";
import { getImage, ImageState, refreshImage, saveImageState } from "../Image";
import {
  getTheme,
  refreshTheme,
  saveTheme,
  Theme,
  THEME_LS_KEY,
} from "../Theme";
import InputGroup from "./InputGroup";
import SettingsSection, {
  SettingsSectionWithChildren,
} from "./SettingsSection";

export default function (
  theme: Theme,
  imageSection: SettingsSection<ImageState>,
) {
  const themeSection = new SettingsSectionWithChildren({
    title: THEME_LS_KEY,
    state: theme,
    sectionEl: document.getElementById("theme-settings") as HTMLElement,
    children: [
      {
        render: function () {
          const selectEl = document.querySelector(
            "#theme-settings select",
          ) as HTMLSelectElement;
          selectEl.innerHTML = ""; // Clear existing options
          const customOption = DomRender.option({
            text: "custom",
            value: "custom",
          });
          selectEl.append(customOption);

          for (const key of Object.keys(THEMES)) {
            const optionEl = DomRender.option({
              text: key,
              value: key,
            });
            selectEl.append(optionEl);
          }
          selectEl.value = "nord"; // Set default to Nord

          selectEl.addEventListener("change", () => {
            const selectedTheme =
              selectEl.value === "custom"
                ? {
                    theme: getTheme(),
                    image: getImage(),
                  }
                : THEMES[selectEl.value as keyof typeof THEMES];
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
            "#theme-settings select",
          ) as HTMLSelectElement;
          selectEl.value = "nord"; // Ensure Nord is selected on rerender
        },
      },
      new InputGroup({
        wrapperEl: document.querySelector(
          "#theme-settings .input-group",
        ) as HTMLElement,
        updateState: (e: Event) => {
          const selectEl = document.querySelector(
            "#theme-settings select",
          ) as HTMLSelectElement;
          selectEl.value = "custom";

          const target = e.target as HTMLInputElement;
          const key = target.name as keyof Theme;
          if (key === "panel opacity")
            themeSection.state[key] = Number(target.value);
          else themeSection.state[key] = target.value;
        },
        getState: (): StringKeyObj => themeSection.state,
        id: THEME_LS_KEY,
      }),
    ],
    onSave: () => {
      saveTheme(themeSection.state);
      saveImageState(imageSection.state);
      refreshTheme(themeSection.state);
    },
  });

  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      const defaultThemeName = "nord"; // Default to Nord
      const selectedTheme = THEMES[defaultThemeName] || {
        theme: getTheme(),
        image: getImage(),
      };
      refreshTheme(selectedTheme.theme);
      refreshImage(selectedTheme.image);
      themeSection.state = selectedTheme.theme;
      imageSection.state = selectedTheme.image;
      themeSection.rerender();
      imageSection.rerender();

      const selectEl = document.querySelector(
        "#theme-settings select",
      ) as HTMLSelectElement;
      if (selectEl) {
        selectEl.innerHTML = "";
        const customOption = DomRender.option({
          text: "custom",
          value: "custom",
        });
        selectEl.append(customOption);
        for (const key of Object.keys(THEMES)) {
          const optionEl = DomRender.option({
            text: key,
            value: key,
          });
          selectEl.append(optionEl);
        }
        selectEl.value = defaultThemeName;
      }
    });
  }

  return themeSection;
}
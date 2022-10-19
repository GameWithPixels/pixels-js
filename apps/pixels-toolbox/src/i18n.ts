import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use({
    type: "languageDetector",
    init: () => {},
    detect: () => Localization.locale.split("_")[0],
    cacheUserLanguage: (_lng: string) => {},
  })
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: "en",
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          startingCamera: "Starting Camera",
        },
      },
      zh: {
        translation: {
          startingCamera: "启动相机",
        },
      },
    },
  });

export default i18n;

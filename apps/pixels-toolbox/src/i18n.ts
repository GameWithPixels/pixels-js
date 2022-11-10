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
          internalError: "Internal error",
          ok: "Ok",
          cancel: "Cancel",
          back: "Back",
          validateBoardNoCoil: "Validate FPC Board No Coil",
          validateFullBoard: "Validate FPC Board",
          validateCastDie: "Validate Resin Die",
          d4: "D4",
          d6: "D6",
          pd6: "Pipped D6",
          d8: "D8",
          d10: "D10",
          d12: "D12",
          d20: "D20",
          startingCamera: "Starting camera...",
          needCameraPermission: "Enable camera permissions",
          incompatibleCamera: "Incompatible camera",
          scanningForPixel: "Scanning for Pixel",
          connectingToPixel: "Connecting to Pixel",
          runningTests: "Running tests",
          updatingFirmware: "Updating firmware",
          pixelValidated: "Pixel Validated",
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

/* eslint-disable prettier/prettier */
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
          // General
          internalError: "Internal error",
          ok: "Ok",
          cancel: "Cancel",
          close: "Close",
          back: "Back",
          d4: "D4",
          d6: "D6",
          pd6: "pipped D6",
          d8: "D8",
          d10: "D10",
          d12: "D12",
          d20: "D20",
          // Validation
          factoryValidation: "Factory Validation",
          openMenuToGoToValidation: "Open Menu To Go To Validation",
          validateBoardNoCoil: "Validate FPC Board No Coil",
          validateFullBoard: "Validate FPC Board",
          validateCastDie: "Validate Resin Die",
          startingCamera: "Starting camera...",
          needCameraPermission: "Enable camera permissions",
          incompatibleCamera: "Incompatible camera",
          die: "die",
          board: "board",
          coil: "coil",
          boardNoCoil: "board without coil",
          testingFormFactor: "Testing {{formFactor}}",
          testingDieTypeWithFormFactor: "Testing {{dieType}} {{formFactor}}",
          scan: "Scan",
          resetUsingMagnet: "Reset {{formFactor}} using magnet and point camera at it",
          batteryWithLevel: "Battery: {{level}}%",
          firmwareUpdate: "Firmware Update",
          initializing: "Initializing",
          dfuStateWithStatus: "DFU State: {{status}}",
          deviceConnecting: "DeviceConnecting",
          deviceDisconnecting: "Disconnecting",
          firmwareValidating: "Validating",
          enablingDfuMode: "Enabling",
          dfuStarting: "Starting",
          dfuCompleted: "Completed",
          dfuAborted: "Aborted",
          scanAndConnect: "Scan & Connect",
          bluetoothScan: "Bluetooth Scan",
          checkDieType: "Check Die Type",
          connect: "Connect",
          checkBoard: "Check Board",
          ledLoopback: "LED Loopback",
          accelerometer: "Accelerometer",
          batteryVoltage: "Battery Voltage",
          rssi: "RSSI",
          waitCharging: "Wait Charging",
          waitNotCharging: "Wait Not Charging",
          removeFromChargerWithCoilOrDie: "Remove {{coilOrDie}} from charger",
          placeOnChargerWithCoilOrDie: "Place {{coilOrDie}} on charger",
          isPlacedOnChargerWithCoilOrDie: "Is {{coilOrDie}} placed on charger?",
          isRemovedFromChargerWithCoilOrDie: "Is {{coilOrDie}} removed from charger?",
          checkLEDs: "Check LEDs",
          areAllLEDsWhiteWithCount: "Are all {{count}} LEDs fully white?",
          waitForShutdown: "Wait For Shutdown",
          waitingDeviceDisconnect: "Waiting For Device To Disconnect",
          waitFaceUp: "Wait Face Up",
          placeBlinkingFaceUp: "Place die blinking face up",
          placeNewBlinkingFaceUp: "Place die new blinking face up",
          isBlinkingFaceUp: "Is blinking face up?",
          prepareDie: "Prepare Die",
          updateProfile: "Update Profile",
          setDieName: "Set Die Name",
          exitValidationMode: "Exit Validation Mode",
          waitDieInCase: "Wait Die In Case",
          placeDieInCaseAndCloseLid: "Place die in case and close the lid",
          // Select Pixel
          noPixelsFound: "No Pixels found so far...",
          scannedPixelsWithCount: "{{count}} Scanned Pixels",
          pixelsWithCount: "{{count}} Pixels",
          tapOnItemToSelect: "Tap On Item To Select:",
          clearScanList: "Clear Scan List",
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

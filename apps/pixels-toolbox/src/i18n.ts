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
          yes: "Yes",
          no: "No",
          d4: "D4",
          d6: "D6",
          pd6: "pipped D6",
          d8: "D8",
          d10: "D10",
          d12: "D12",
          d20: "D20",
          colonSeparator: ": ",
          commaSeparator: ", ",
          // Connection status
          disconnected: "disconnected",
          connecting: "connecting",
          identifying: "identifying",
          ready: "ready",
          disconnecting: "disconnecting",
          // Roll status
          unknown: "unknown",
          onFace: "on face",
          handling: "handling",
          rolling: "rolling",
          crooked: "crooked",
          // Home
          pixelsScanner: "Pixels Scanner",
          tapToSelectFirmware: "Tap To Select Firmware",
          screenWithSize: "Screen: {{width}}x{{height}}",
          osNameWithVersion: "OS: {{name}} {{version}}",
          applyToAllRelevantPixels: "Apply To All Relevant Pixels",
          pixelsWithCount: "{{count}} Pixels",
          connect: "Connect",
          disconnect: "Disconnect",
          blink: "Blink",
          updateProfile: "Update Profile",
          updateBootloaderAndFirmware: "Update Bootloader & Firmware",
          // Select Pixel
          noPixelsFound: "No Pixels found so far...",
          scannedPixelsWithCount: "{{count}} Scanned Pixels",
          tapOnItemToSelect: "Tap On Item To Select",
          clearScanList: "Clear Scan List",
          // Pixel card
          dBWithValue: "{{value}}dB",
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "Firmware",
          cancelFirmwareUpdate: "Cancel Firmware Update",
          updateFirmware: "Update Firmware",
          status: "Status",
          advertising: "advertising",
          clearError: "Clear Error",
          unavailable: "Unavailable",
          secondsWithValue: "{{value}} secs",
          minutesWithValue: "{{value}} mins",
          waitingOnFirmwareUpdate: "Waiting On Firmware Update...",
          pixelId: "Pixel Id",
          leds: "LEDs",
          battery: "Battery",
          charging: "Charging",
          chargingState: "Charging State",
          rssi: "RSSI",
          temperature: "Temperature",
          mcuTemperature: "MCU Temperature",
          batteryTemperature: "Battery Temperature",
          celsiusWithValue: "{{value}}??C",
          rollState: "Roll State",
          calibrate: "Calibrate",
          rainbow: "Rainbow",
          resetProfile: "Reset Profile",
          // Validation
          factoryValidation: "Factory Validation",
          openMenuToGoToValidation: "Open Menu To Go To Validation",
          validateBoardNoCoil: "Validate FPC Board No Coil",
          validateFullBoard: "Validate FPC Board",
          validateCastDie: "Validate Resin Die",
          startingCamera: "Starting camera...",
          needCameraPermission: "Enable camera permissions",
          die: "die",
          board: "board",
          coil: "coil",
          boardNoCoil: "board without coil",
          testingFormFactor: "Testing {{formFactor}}",
          testingDieTypeWithFormFactor: "Testing {{dieType}} {{formFactor}}",
          scan: "Scan",
          resetUsingMagnet: "Reset {{formFactor}} using magnet and point camera at it",
          firmwareUpdate: "Firmware Update",
          initializing: "initializing",
          dfuStateWithStatus: "DFU State: {{status}}",
          deviceConnecting: "connecting",
          deviceDisconnecting: "disconnecting",
          firmwareValidating: "validating firmware",
          enablingDfuMode: "enabling",
          dfuStarting: "starting",
          dfuCompleted: "completed",
          dfuAborted: "aborted",
          scanAndConnect: "Scan & Connect",
          bluetoothScan: "Bluetooth Scan",
          checkDieType: "Check Die Type",
          checkBoard: "Check Board",
          ledLoopback: "LED Loopback",
          accelerometer: "Accelerometer",
          batteryVoltage: "Battery Voltage",
          waitCharging: "Wait Charging",
          waitNotCharging: "Wait Not Charging",
          removeFromChargerWithCoilOrDie: "Remove {{coilOrDie}} from charger",
          placeOnChargerWithCoilOrDie: "Place {{coilOrDie}} on charger",
          isPlacedOnChargerWithCoilOrDie: "Is {{coilOrDie}} placed on charger?",
          isRemovedFromChargerWithCoilOrDie: "Is {{coilOrDie}} removed from charger?",
          checkLEDs: "Check LEDs",
          areAllLEDsWhiteWithCount: "Are all {{count}} LEDs fully white?",
          waitForShutdown: "Wait For Shutdown",
          turningOff: "Turning Off",
          waitingDeviceDisconnect: "Waiting For Device To Disconnect",
          waitFaceUp: "Wait Face Up",
          placeBlinkingFaceUp: "Place die blinking face up",
          placeNewBlinkingFaceUp: "Place die new blinking face up",
          isBlinkingFaceUp: "Is blinking face up?",
          prepareDie: "Prepare Die",
          setDieName: "Set Die Name",
          exitValidationMode: "Exit Validation Mode",
          waitDieInCase: "Wait Die In Case",
          placeDieInCaseAndCloseLid: "Place die in case and close the lid",
          // Roll Demo
          rollDemo: "Roll Demo",
          animationsEditor: "Animations Editor",
          diceRenderer: "3D Dice Renderer",
        },
      },
      zh: {
        translation: {
          // General
          internalError: "????????????",
          ok: "??????",
          cancel: "??????",
          close: "??????",
          back: "??????",
          yes: "???",
          no: "???",
          d4: "D4",
          d6: "D6",
          pd6: "pipped D6",
          d8: "D8",
          d10: "D10",
          d12: "D12",
          d20: "D20",
          colonSeparator: "???",
          commaSeparator: "???",
          // Connection status
          disconnected: "???????????????",
          connecting: "?????????",
          identifying: "?????????",
          ready: "?????????",
          disconnecting: "???????????????",
          // Roll status
          unknown: "??????",
          onFace: "?????????????????????",
          handling: "????????????",
          rolling: "???????????????",
          crooked: "??????????????????",
          // Home
          pixelsScanner: "???????????????",
          tapToSelectFirmware: "??????????????????",
          screenWithSize: "??????: {{width}}x{{height}}",
          osNameWithVersion: "OS: {{name}} {{version}}",
          applyToAllRelevantPixels: "??????????????????????????????",
          pixelsWithCount: "{{count}} ?????????",
          connect: "??????",
          disconnect: "????????????",
          blink: "??????",
          updateProfile: "????????????",
          updateBootloaderAndFirmware: "?????????????????????????????????",
          // Select Pixel
          noPixelsFound: "??????????????????",
          scannedPixelsWithCount: "{{count}} ??????????????????",
          tapOnItemToSelect: "????????????????????????",
          clearScanList: "??????????????????",
          // Pixel card
          dBWithValue: "{{value}}dB",
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "??????",
          cancelFirmwareUpdate: "??????????????????",
          updateFirmware: "????????????",
          status: "??????",
          advertising: "?????????",
          clearError: "????????????",
          unavailable: "?????????",
          secondsWithValue: "{{value}} ???",
          minutesWithValue: "{{value}} ??????",
          waitingOnFirmwareUpdate: "??????????????????",
          pixelId: "??????ID",
          leds: "LEDs",
          battery: "??????",
          charging: "?????????",
          chargingState: "????????????",
          rssi: "RSSI",
          temperature: "??????",
          mcuTemperature: "MCU ??????",
          batteryTemperature: "????????????",
          celsiusWithValue: "{{value}}??C",
          rollState: "????????????",
          calibrate: "??????",
          rainbow: "??????????????????",
          resetProfile: "????????????",
          // Validation
          factoryValidation: "????????????",
          openMenuToGoToValidation: "??????????????????????????????",
          validateBoardNoCoil: "??????FPC????????????????????????",
          validateFullBoard: "??????FPC???",
          validateCastDie: "????????????",
          startingCamera: "???????????????",
          needCameraPermission: "?????????????????????",
          die: "??????",
          board: "???",
          coil: "??????",
          boardNoCoil: "?????????????????????",
          testingFormFactor: "?????? {{formFactor}}",
          testingDieTypeWithFormFactor: "?????? {{dieType}} {{formFactor}}",
          scan: "??????",
          resetUsingMagnet: "?????????????????? {{formFactor}}??????????????????????????????",
          firmwareUpdate: "????????????",
          initializing: "???????????????",
          dfuStateWithStatus: "DFU ??????: {{status}}",
          deviceConnecting: "????????????",
          deviceDisconnecting: "????????????",
          firmwareValidating: "?????????",
          enablingDfuMode: "?????????",
          dfuStarting: "??????",
          dfuCompleted: "??????",
          dfuAborted: "??????",
          scanAndConnect: "??????&??????",
          bluetoothScan: "????????????",
          checkDieType: "??????????????????",
          checkBoard: "?????????",
          ledLoopback: "LED??????",
          accelerometer: "????????????",
          batteryVoltage: "????????????",
          waitCharging: "????????????",
          waitNotCharging: "????????????",
          removeFromChargerWithCoilOrDie: "?????????????????????{{coilOrDie}} ",
          placeOnChargerWithCoilOrDie: "??? {{coilOrDie}}  ??????????????????",
          isPlacedOnChargerWithCoilOrDie: "{{coilOrDie}} ??????????????????????????????",
          isRemovedFromChargerWithCoilOrDie: "{{coilOrDie}} ??????????????????????????????",
          checkLEDs: "??????LED",
          areAllLEDsWhiteWithCount: " {{count}}LED????????????????????????",
          waitForShutdown: "????????????",
          turningOff: "?????????",
          waitingDeviceDisconnect: "????????????????????????",
          waitFaceUp: "??????????????????",
          placeBlinkingFaceUp: "???????????????????????????",
          placeNewBlinkingFaceUp: "?????????????????????????????????",
          isBlinkingFaceUp: "????????????????????????",
          prepareDie: "????????????",
          setDieName: "??????????????????",
          exitValidationMode: "??????????????????",
          waitDieInCase: "????????????????????????",
          placeDieInCaseAndCloseLid: "????????????????????????????????????",
        },
      },
    },
  });

export default i18n;

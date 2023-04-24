/* eslint-disable prettier/prettier */
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export function capitalize(str: string): string {
  const l = str?.length;
  if (!l) {
    return str;
  } else if (l === 1) {
    return str.toUpperCase()
  } else {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
};

export function getLanguageShortCode(language: string): string {
  return language.split("_")[0].split("-")[0];
}

i18n
  .use({
    type: "languageDetector",
    init: () => {},
    detect: () => getLanguageShortCode(Localization.locale),
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
          // Connection statuses
          disconnected: "disconnected",
          connecting: "connecting",
          identifying: "identifying",
          ready: "ready",
          disconnecting: "disconnecting",
          // Roll statuses
          unknown: "unknown",
          onFace: "on face",
          handling: "handling",
          rolling: "rolling",
          crooked: "crooked",
          // Battery statuses
          low: "Low",
          transition: "Transition",
          badCharging: "Bad Charging",
          error: "Error",
          charging: "Charging",
          trickleCharge: "Trickle Charge",
          done: "Done",
          lowTemp: "Low Temperature",
          highTemp: "High Temperature",

          // Pixels Scan List
          noPixelsFound: "No Pixels found so far...",
          scannedPixelsWithCount: "{{count}} Scanned Pixels",
          tapOnItemToSelect: "Tap On Item To Select",
          clearScanList: "Clear Scan List",

          // Pixels Info
          dBWithValue: "{{value}}dB",
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "Firmware",
          cancelFirmwareUpdate: "Cancel Firmware Update",
          updateFirmware: "Update Firmware",
          waitingOnFirmwareUpdate: "Waiting On Firmware Update...",
          // updatingFirmware: "Updating Firmware",
          status: "Status",
          advertising: "advertising",
          clearError: "Clear Error",
          unavailable: "Unavailable",
          secondsWithValue: "{{value}} secs",
          minutesWithValue: "{{value}} mins",
          pixelId: "Pixel Id",
          leds: "LEDs",
          battery: "Battery",
          chargingState: "Charging State",
          internalChargerState: "MCP73832 Charger State",
          internalChargerOverrideState: "MCP73832 Override State",
          chargerOn: "Charger On",
          chargerOff: "Charger Off",
          disallowCharging: "Disallow Charging",
          allowCharging: "Allow Charging",
          rssi: "RSSI",
          temperature: "Temperature",
          mcuTemperature: "MCU Temperature",
          batteryTemperature: "Battery Temperature",
          celsiusWithValue: "{{value}}°C",
          rollState: "Roll State",
          calibrate: "Calibrate",
          rainbow: "Rainbow",
          resetProfile: "Reset Profile",
          discharge: "Discharge",
          stopDischarge: "Stop Discharging",
          enableCharging: "Enable Charging",
          disableCharging: "Disable Charging",
          blinkId: "Blink Id",
          updatingProfile: "Updating Profile",
          dischargeCurrentWithValue: "Discharge Current: {{current}}mA",
          turnOff: "Turn Off",

          // Home Screen
          pixelsScanner: "Pixels Scanner",
          selectFirmware: "Select Firmware",
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

          // Validation Screen
          factoryValidation: "Factory Validation",
          openMenuToGoToValidation: "Open Menu To Go To Validation",
          validateBoardNoCoil: "Validate FPC Board No Coil",
          validateFullBoard: "Validate FPC Board",
          validateResinDie: "Validate Resin Die",
          validateDieFinal: "Final Validation",
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

          // Roll Screen
          rollDemo: "Roll Demo",
          animationsEditor: "Animations Editor",
          diceRenderer: "3D Dice Renderer",
        },
      },
      zh: {
        translation: {
          // General
          internalError: "内部错误",
          ok: "正确",
          cancel: "取消",
          close: "关闭",
          back: "后退",
          yes: "是",
          no: "否",
          d4: "D4",
          d6: "D6",
          pd6: "pipped D6",
          d8: "D8",
          d10: "D10",
          d12: "D12",
          d20: "D20",
          colonSeparator: "：",
          commaSeparator: "，",
          // Connection statuses
          disconnected: "已断开连接",
          connecting: "连接中",
          identifying: "识别中",
          ready: "准备好",
          disconnecting: "断开连接中",
          // Roll statuses
          unknown: "未知",
          onFace: "骰子稳定放置好",
          handling: "用手摇晃",
          rolling: "骰子滚动中",
          crooked: "骰子位置不平",
          // Battery statuses
          low: "电池电量低",
          transition: "过渡中",
          badCharging: "充电不成功",
          error: "充电错误",
          charging: "充电中",
          trickleCharge: "缓慢充电",
          done: "充电完成",
          lowTemp: "低温",
          highTemp: "高温",

          // Pixels Scan List
          noPixelsFound: "没有发现骰子",
          scannedPixelsWithCount: "{{count}} 扫描后的骰子",
          tapOnItemToSelect: "点击型号进行选择",
          clearScanList: "清空扫描清单",

          // Pixel Info
          dBWithValue: "{{value}}dB",
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "固件",
          cancelFirmwareUpdate: "取消固件更新",
          updateFirmware: "更新固件",
          waitingOnFirmwareUpdate: "等待固件更新",
          // updatingFirmware: "更新固件中",
          status: "状态",
          advertising: "广播中",
          clearError: "清除错误",
          unavailable: "不可用",
          secondsWithValue: "{{value}} 秒",
          minutesWithValue: "{{value}} 分钟",
          pixelId: "骰子ID",
          leds: "LEDs",
          battery: "电池",
          chargingState: "电池状态",
          internalChargerState: "MCP73832充电器状态",
          internalChargerOverrideState: "MCP73832 改写状态",
          chargerOn: "打开充电器",
          chargerOff: "关闭充电器",
          disallowCharging: "不允许充电",
          allowCharging: "允许充电",
          rssi: "RSSI",
          temperature: "温度",
          mcuTemperature: "MCU 温度",
          batteryTemperature: "电池温度",
          celsiusWithValue: "{{value}}°C",
          rollState: "滚动状态",
          calibrate: "校准",
          rainbow: "彩虹动画效果",
          resetProfile: "重置资料",
          discharge: "放电",
          stopDischarge: "停止放电",
          enableCharging: "开始充电",
          disableCharging: "停止充电",
          blinkId: "闪烁ID",
          updatingProfile: "Updating Profile",
          dischargeCurrentWithValue: "Discharge Current: {{current}}mA",
          turnOff: "Turn Off",

          // Home Screen
          pixelsScanner: "骰子扫描器",
          selectFirmware: "选择固件",
          tapToSelectFirmware: "点击选择固件",
          screenWithSize: "屏幕: {{width}}x{{height}}",
          osNameWithVersion: "OS: {{name}} {{version}}",
          applyToAllRelevantPixels: "适用于所有相关的骰子",
          pixelsWithCount: "{{count}} 个骰子",
          connect: "连接",
          disconnect: "断开联系",
          blink: "闪烁",
          updateProfile: "更新资料",
          updateBootloaderAndFirmware: "更新引导装载程序和固件",

          // Validation Screen
          factoryValidation: "工厂测试",
          openMenuToGoToValidation: "打开菜单进入测试模式",
          validateBoardNoCoil: "测试FPC光板（不带线圈）",
          validateFullBoard: "测试FPC板",
          validateResinDie: "测试骰子",
          validateDieFinal: "Final Validation",
          startingCamera: "打开摄像头",
          needCameraPermission: "打开摄像头权限",
          die: "骰子",
          board: "板",
          coil: "线圈",
          boardNoCoil: "没有线圈的板子",
          testingFormFactor: "测试 {{formFactor}}",
          testingDieTypeWithFormFactor: "测试 {{dieType}} {{formFactor}}",
          scan: "扫描",
          resetUsingMagnet: "使用磁铁重置 {{formFactor}}，然后使用摄像头对准",
          firmwareUpdate: "更新固件",
          initializing: "正在初始化",
          dfuStateWithStatus: "DFU 状态: {{status}}",
          deviceConnecting: "连接设备",
          deviceDisconnecting: "断开连接",
          firmwareValidating: "测试中",
          enablingDfuMode: "启动中",
          dfuStarting: "开始",
          dfuCompleted: "完成",
          dfuAborted: "中断",
          scanAndConnect: "扫描&连接",
          bluetoothScan: "扫描蓝牙",
          checkDieType: "检查骰子类型",
          checkBoard: "检查板",
          ledLoopback: "LED回送",
          accelerometer: "加速度计",
          batteryVoltage: "电池电压",
          waitCharging: "等待充电",
          waitNotCharging: "没有充电",
          removeFromChargerWithCoilOrDie: "从充电器上移开{{coilOrDie}} ",
          placeOnChargerWithCoilOrDie: "把 {{coilOrDie}}  放在充电器上",
          isPlacedOnChargerWithCoilOrDie: "{{coilOrDie}} 是否放到充电器上了？",
          isRemovedFromChargerWithCoilOrDie: "{{coilOrDie}} 是否从充电器上移开？",
          checkLEDs: "检查LED",
          areAllLEDsWhiteWithCount: " {{count}}LED是否都显示白色？",
          waitForShutdown: "等待关机",
          turningOff: "关闭中",
          waitingDeviceDisconnect: "等待设备断开连接",
          waitFaceUp: "等待正面朝上",
          placeBlinkingFaceUp: "等待骰子闪光面朝上",
          placeNewBlinkingFaceUp: "等待骰子新的闪光面朝上",
          isBlinkingFaceUp: "闪光面是否朝上？",
          prepareDie: "准备骰子",
          setDieName: "设置骰子名字",
          exitValidationMode: "退出测试模式",
          waitDieInCase: "等待骰子放入盒中",
          placeDieInCaseAndCloseLid: "将骰子放在盒中并关闭盖子",
        },
      },
    },
  });

export default i18n;

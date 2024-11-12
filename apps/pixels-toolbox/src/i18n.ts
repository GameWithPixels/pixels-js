import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export function capitalize(str: string): string {
  const l = str?.length;
  if (!l) {
    return str;
  } else if (l === 1) {
    return str.toUpperCase();
  } else {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

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
    debug: __DEV__,
    fallbackLng: "en",
    compatibilityJSON: "v3",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          // General
          ok: "Ok",
          cancel: "Cancel",
          close: "Close",
          back: "Back",
          next: "Next",
          yes: "Yes",
          no: "No",
          d4: "D4",
          d6: "D6",
          d6pipped: "Pipped D6",
          d6fudge: "Fudge D6",
          d8: "D8",
          d10: "D10",
          d00: "D00",
          d12: "D12",
          d20: "D20",
          charger: "Charger",
          colonSeparator: ": ",
          commaSeparator: ", ",
          // Connection statuses
          disconnected: "disconnected",
          connecting: "connecting",
          connected: "connected",
          identifying: "identifying",
          ready: "ready",
          disconnecting: "disconnecting",
          // Roll statuses
          unknown: "unknown",
          rolled: "rolled",
          onFace: "on face",
          handling: "handling",
          rolling: "rolling",
          crooked: "crooked",
          // Battery statuses
          low: "Low",
          charging: "Charging",
          done: "Done",
          badCharging: "Bad Charging",
          error: "Error",
          // Colorways
          onyxBlack: "Onyx Black",
          hematiteGrey: "Hematite Grey",
          midnightGalaxy: "Midnight Galaxy",
          auroraSky: "Aurora Sky",
          whiteAurora: "White Aurora",
          clear: "Clear",
          custom: "Custom",
          // Battery Controller State
          empty: "Empty",
          transitionOn: "Transition On",
          transitionOff: "Transition Off",
          chargingLow: "Charging Low",
          cooldown: "Cooldown",
          trickle: "Trickle",
          lowTemp: "Low Temperature",
          highTemp: "High Temperature",
          // Battery Controller Mode
          default: "Default",
          forceDisableCharging: " ",
          forceEnableCharging: "Force Enable Charging",

          // Pixels Scan List
          noPixelsFound: "No Pixels die found so far...",
          noPixelsDieOrChargerFound: "No Pixels die or charger found so far...",
          scannedPixelsWithCount: "{{count}} Scanned Pixels",
          tapOnItemToSelect: "Tap On Item To Select",
          clearScanList: "Clear Scan List",

          // Pixels Info
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "Firmware",
          bootloader: "Bootloader",
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
          colorway: "Colorway",
          dieType: "Die Type",
          battery: "Battery",
          chargingState: "Charging State",
          batteryControllerState: "Battery Controller State",
          batteryControllerMode: "Battery Controller Mode",
          internalChargerState: "MCP73832 Charger State",
          chargerOn: "Charger On",
          chargerOff: "Charger Off",
          setChargerMode: "Set Charger Mode",
          rssi: "RSSI",
          temperature: "Temperature",
          mcuTemperature: "MCU Temperature",
          batteryTemperature: "Battery Temperature",
          celsiusWithValue: "{{value}}°C",
          rollState: "Roll State",
          calibrate: "Calibrate",
          rainbow: "Rainbow",
          fixedRainbow: "Static Rainbow",
          discharge: "Discharge",
          stopDischarge: "Stop Discharging",
          blinkId: "Blink Id",
          updatingProfile: "Updating Profile",
          dischargeCurrentWithValue: "Discharge Current: {{current}}mA",
          turnOff: "Turn Off",
          resetAllSettings: "Reset All Settings",
          setMinimalProfile: "Set Minimal Profile",
          setUserProfile: "Set User Profile",
          enableTelemetry: "Enable Telemetry",
          saveTelemetry: "Save Telemetry",
          telemetryGraph: "Telemetry Graph",
          exportLogs: "Export Logs",
          reset: "Reset",
          full: "Full",
          printLabel: "Print Label",
          rename: "Rename",
          setFixedRainbowProfile: "Upload Static Hello",
          setFixedRainbowProfileD4: "Upload Static D4",
          unknownDieType: "Unknown Die Type",
          unknownColorway: "Unknown Colorway",
          descriptionShort: "Desc.",
          preparingAsPrintStatus: "Preparing label...",
          sendingAsPrintStatus: "Sending label to printer...",
          doneAsPrintStatus: "Print successful",
          errorAsPrintStatus: "Error printing label",
          playKeyframes: "Play Keyframes",
          setProfile: "Set Profile",
          playAnimation: "Play Animation",
          setDieType: "Set Die Type",
          setDieColorway: "Set Colorway",
          index: "index",
          voltageMV: "Voltage (mV)",

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
          rainbowAllFaces: "Rainbow All Faces",
          playProfileAnim: "Play Profile Anim",
          playProfileAnimation: "Play Profile Animation",
          updateProfile: "Update Profile",
          resetProfile: "Reset Profile",
          updateBootloaderAndFirmware: "Update Bootloader & Firmware",
          updateAvailableGoToSettings:
            "Update available, go to Settings page to install.",
          filtersAndOptions: "Filters & Options",
          onlyConnected: "Only Connected",
          expandedInfo: "Expanded Info",
          selectViewOptions: "Select View Options",
          dieTypes: "Die Types",
          selectAll: "Select All",
          unselectAll: "Unselect All",

          // DFU
          dfuStateWithStatus: "DFU State: {{status}}",
          initializing: "initializing",
          validatingFirmware: "validating firmware",
          enablingDfuMode: "enabling",
          starting: "starting",
          uploading: "uploading",
          completed: "completed",
          aborted: "aborted",
          errored: "errored",

          // Validation Screen
          factoryValidation: "Factory Validation",
          validateBoardNoCoil: "Validate FPC Board No Coil",
          validateBoard: "Validate FPC Board",
          validateDie: "Validate Resin Die",
          validateDieFinal: "Final Validation",
          validateDieReconfigure: "Reconfigure Die",
          startingCamera: "Starting camera...",
          needCameraPermission: "Enable camera permissions",
          die: "die",
          dieFinal: "die (final)",
          board: "board",
          coil: "coil",
          boardNoCoil: "board without coil",
          scan: "Scan",
          enterSNFromLabel: "Enter SN written on label, starting by PXL",
          numberMadeOf8CharactersNoCase:
            "This serial number has 8 characters, case doesn't matter",
          invalidSN: "Invalid SN",
          pressOkOrReturnToValidate: "Press Ok or Return to validate",
          resetUsingMagnetWithFormFactor:
            "Reset {{formFactor}} using magnet and point camera at it",
          firmwareUpdate: "Firmware Update",
          bluetoothScan: "Bluetooth Scan",
          checkDieType: "Check Die Type",
          checkLEDCount: "Check LED Count",
          checkBoard: "Check Board",
          accelerometer: "Accelerometer",
          batteryVoltage: "Battery Voltage",
          batteryLevel: "Battery Level",
          waitCharging: "Wait Charging",
          waitNotCharging: "Wait Not Charging",
          removeFromChargerWithCoilOrDie: "Remove {{coilOrDie}} from charger",
          placeOnChargerWithCoilOrDie: "Place {{coilOrDie}} on charger",
          checkLEDs: "Check LEDs",
          areAllLEDsWhite: "Are all LEDs fully white?",
          waitForShutdown: "Wait For Shutdown",
          turningOff: "Turning Off",
          waitingDeviceDisconnect: "Waiting For Device To Disconnect",
          waitFaceUp: "Wait Face Up",
          placeBlinkingFaceUp: "Place blinking face up",
          placeNewBlinkingFaceUp: "Place new blinking face up",
          isBlinkingFaceUp: "Is blinking face up?",
          prepareDie: "Prepare Die",
          setDieName: "Set Die Name",
          exitValidationMode: "Exit Validation Mode",
          waitDieInCase: "Wait Die In Case",
          placeDieInCaseAndCloseLid: "Place die in case and close the lid",
          canceled: "Canceled",
          testSucceeded: "Test Successful!",
          testFailed: "Test Failed!",
          testCanceled: "Test Canceled!",
          clearSettings: "Clear Settings",
          storeSettings: "Store Settings",
          storeDieType: "Store Die Type",
          storeColorway: "Store Colorway",
          keepColorway: "Keep colorway?",
          selectColorway: "Select Colorway",
          storeTimestamp: "Store Timestamp",
          labelPrinting: "Label Printing",
          waitingOnPrint: "Waiting On Print",
          errorPrintingLabel: "Error printing label",
          isLabelPrinted: "Is label correctly printed?",
          tryPrintingLabelAgain: "Try printing label again?",
          timeoutScanningTryAgainWithId:
            "Timeout scanning for Pixel {{id}}, reset device and try again.",
          connectionErrorTryAgain:
            "Connection error, reset device and try again.",
          dfuErrorTryAgain:
            "Error trying to update firmware, reset device and try again.",
          dieTypeMismatchWithTypeAndLedCount:
            "Die type mismatch, expected {{dieType}} but die has {{ledCount}} LEDs",
          dieTypeMismatchWithExpectedAndReceived:
            "Die type mismatch, expected {{expected}} but got {{received}}",
          updateDieTypeWithFromAndTo:
            "Update die type to {{to}}? Programmed type is {{from}}.",
          lowBatteryPleaseCharge: "Low battery, please charge",
          updateFirmwareIfOlderWithDate:
            "Factory Validation will update firmware if on-board firmware is older than {{date}}.",
          loadingFirmwareFiles: "Loading firmware files...",
          errorLoadingFirmwareFiles: "Error loading firmware files",
          diceUpdatedWithCustomFirmwareWarning:
            "Dice will be updated with the firmware selected in the Scanner Page!",
          selection: "Selection",
          invalidLedCountWithValue: "Invalid LED count: {{value}}",
          invalidAccelerometerValue: "Invalid accelerometer value: {{value}}",
          outOfRangeBatteryVoltage: "Out of range battery voltage: {{value}}v",
          timeoutWhileWaitingForChargingState:
            "Timeout waiting for 'charging' state. Controller state: {{state}}, coil: {{vCoil}}v",
          timeoutWhileWaitingForNotChargingState:
            "Timeout waiting for 'not charging' state. Controller state: {{state}}, coil: {{vCoil}}v",
          timeoutWaitingForFace:
            "Timeout waiting for face {{face}}. Face up: {{rollFace}}, roll state: {{rollState}}",
          disconnectedFromPixel: "Disconnected from Pixel",
          timedOutWithValue: "Timed out after {{value}}s",
          selectProfile: "Select Profile",

          // Label printing
          carton: "Carton",
          diceSetBox: "Dice Set Box",
          asn: "ASN",
          example: "Example",
          productCategory: "Product Category",
          singleDie: "Single Die",
          diceSet: "Dice Set",
          productType: "Product Type",
          quantity: "Quantity",
          copies: "Copies",
          print: "Print",

          // Dice sets
          rpg: "RPG",
          advantage: "Advantage",
          boardGamer: "Board Gamer",
          power: "Power",
          fudge: "Fudge",
          classicPippedD6: "Classic Pipped D6",
          initiativeD20: "Initiative D20",
          rageD12: "Rage D12",
          divineD00: "Divine D00",
          eldritchD10: "Eldritch D10",
          smiteD8: "Smite D8",
          fireballD6: "Fireball D6",
          healingD4: "Healing D4",

          // Roll Screen
          rollDemo: "Roll Demo",
          animationsEditor: "Animations Editor",
          diceRenderer: "3D Dice Renderer",

          // Settings
          settings: "Settings",
        },
      },
      zh: {
        translation: {
          // General
          ok: "正确",
          cancel: "取消",
          close: "关闭",
          back: "后退",
          next: "下一个",
          yes: "是",
          no: "否",
          colonSeparator: "：",
          commaSeparator: "，",
          // Connection statuses
          disconnected: "已断开连接",
          connecting: "连接中",
          connected: "已连接",
          identifying: "识别中",
          ready: "准备好",
          disconnecting: "断开连接中",
          // Roll statuses
          unknown: "未知",
          rolled: "卷起的",
          onFace: "骰子稳定放置好",
          handling: "用手摇晃",
          rolling: "骰子滚动中",
          crooked: "骰子位置不平",
          // Battery statuses
          low: "电池电量低",
          charging: "充电中",
          done: "充电完成",
          badCharging: "充电不成功",
          error: "充电错误",
          // Colorways
          onyxBlack: "深黑色",
          hematiteGrey: "赤铁灰",
          midnightGalaxy: "星空色",
          auroraSky: "天蓝色",
          whiteAurora: "白极光色",
          clear: "透明色",
          custom: "定制色",
          // Battery Controller State
          // empty: "Empty",
          // transitionOn: "Transition On",
          // transitionOff: "Transition Off",
          // chargingLow: "Charging Low",
          // cooldown: "Cooldown",
          // trickle: "Trickle",
          // lowTemp: "Low Temperature",
          // highTemp: "High Temperature",
          // Battery Controller Mode
          default: "默认",
          forceDisableCharging: "强制禁用充电",
          forceEnableCharging: "强制启用充电",

          // Pixels Scan List
          noPixelsFound: "没有发现骰子",
          scannedPixelsWithCount: "{{count}} 扫描后的骰子",
          tapOnItemToSelect: "点击型号进行选择",
          clearScanList: "清空扫描清单",

          // Pixel Info
          percentWithValue: "{{value}}%",
          voltageWithValue: "{{value}}V",
          dBmWithValue: "{{value}}dBm",
          firmware: "固件",
          bootloader: "Bootloader",
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
          colorway: "亮光方式",
          dieType: "骰子类型",
          battery: "电池",
          chargingState: "电池状态",
          batteryControllerState: "电池充电放电状态",
          batteryControllerMode: "电池控制模式",
          internalChargerState: "MCP73832充电器状态",
          chargerOn: "打开充电器",
          chargerOff: "关闭充电器",
          rssi: "RSSI",
          temperature: "温度",
          mcuTemperature: "MCU 温度",
          batteryTemperature: "电池温度",
          celsiusWithValue: "{{value}}°C",
          rollState: "滚动状态",
          calibrate: "校准",
          rainbow: "彩虹动画效果",
          discharge: "放电",
          stopDischarge: "停止放电",
          blinkId: "闪烁ID",
          updatingProfile: "更新资料",
          dischargeCurrentWithValue: "放电电流：{{current}}mA",
          turnOff: "关闭",
          resetAllSettings: "重置所有设置",
          printLabel: "打印标签",
          rename: "重命名",
          unknownDieType: "未知的骰子类型",
          unknownColorway: "未知的亮光方式",
          descriptionShort: "描述",
          preparingAsPrintStatus: "准备标贴",
          sendingAsPrintStatus: "发送标贴到打印机",
          doneAsPrintStatus: "打印成功",
          charger: "充电器",
          index: "指数",

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
          updateAvailableGoToSettings: "有新的更新，请到设置页面安装。",

          // DFU
          dfuStateWithStatus: "DFU 状态：{{status}}",
          initializing: "正在初始化",
          validatingFirmware: "测试中",
          enablingDfuMode: "启动中",
          starting: "开始",
          uploading: "上传中",
          completed: "完成",
          aborted: "中断",
          errored: "errored",

          // Validation Screen
          factoryValidation: "工厂测试",
          validateBoardNoCoil: "测试FPC光板（不带线圈）",
          validateBoard: "测试FPC板",
          validateDie: "测试骰子",
          validateDieFinal: "最终的验证",
          validateDieReconfigure: "重新配置骰子",
          startingCamera: "打开摄像头",
          needCameraPermission: "打开摄像头权限",
          die: "骰子",
          dieFinal: "骰子（最终的）",
          board: "板",
          coil: "线圈",
          boardNoCoil: "没有线圈的板子",
          scan: "扫描",
          enterSNFromLabel: "输入标贴上的序列号，由PXL开始",
          numberMadeOf8CharactersNoCase: "此序列号有8个数字",
          invalidSN: "无效的序列号",
          pressOkOrReturnToValidate: "按OK或重新返回验证",
          resetUsingMagnetWithFormFactor:
            "使用磁铁重置 {{formFactor}}，然后使用摄像头对准",
          firmwareUpdate: "更新固件",
          bluetoothScan: "扫描蓝牙",
          checkDieType: "检查骰子类型",
          checkLEDCount: "检查LED数量",
          checkBoard: "检查板",
          accelerometer: "加速度计",
          batteryVoltage: "电池电压",
          batteryLevel: "电池容量",
          waitCharging: "等待充电",
          waitNotCharging: "没有充电",
          removeFromChargerWithCoilOrDie: "从充电器上移开{{coilOrDie}} ",
          placeOnChargerWithCoilOrDie: "把{{coilOrDie}}放在充电器上",
          checkLEDs: "检查LED",
          areAllLEDsWhite: "是否所有的LED灯都显示白色？",
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
          canceled: "取消",
          testSucceeded: "测试成功！",
          testFailed: "测试失败！",
          testCanceled: "取消测试！",
          clearSettings: "清除设置",
          storeSettings: "保存设置",
          storeDieType: "保存骰子类型",
          storeColorway: "保存亮光方式",
          keepColorway: "保持亮光方式",
          selectColorway: "选择亮光方式",
          storeTimestamp: "保存时间戳",
          labelPrinting: "标签印刷",
          waitingOnPrint: "等待印刷",
          errorPrintingLabel: "标签不会被打印",
          isLabelPrinted: "标贴是否印刷正确？",
          tryPrintingLabelAgain: "尝试重新打印标贴？",
          timeoutScanningTryAgainWithId:
            "扫描时间已经超时{{id}}，请重置设备并重新开始。",
          connectionErrorTryAgain: "连接错误，请重置设备并重新开始。",
          dfuErrorTryAgain: "更新固件错误，请重置机器并重新尝试。",
          dieTypeMismatchWithTypeAndLedCount:
            "骰子类型错误，应该是{{dieType}}但是骰子显示有{{ledCount}}LEDs。",
          dieTypeMismatchWithExpectedAndReceived:
            "骰子类型错误，本应该是{{expected}} 结果是{{received}}",
          updateDieTypeWithFromAndTo:
            "更新骰子类型是{{to}}，烧录的类型是{{from}}",
          lowBatteryPleaseCharge: "电池电量低，需要充电",
          updateFirmwareIfOlderWithDate:
            "工厂测试时会升级低于这个{{date}}的固件的FPC",
          loadingFirmwareFiles: "装载固件中...",
          errorLoadingFirmwareFiles: "装载固件错误",
          invalidLedCountWithValue: "错误的LED数量：{{value}}",
          invalidAccelerometerValue: "错误的加速度计值：{{value}}",
          outOfRangeBatteryVoltage: "电池电压超出范围：{{value}}v",
          timeoutWhileWaitingForChargingState:
            "等待充电状态超时，控制的状态是{{state}}，线圈电压是{{vCoil}}v",
          timeoutWhileWaitingForNotChargingState:
            "等待不充电超时，控制的状态是{{state}}，线圈电压是{{vCoil}}v",
          timeoutWaitingForFace:
            "等待{{face}}面朝上超时，朝上面是{{rollFace}}，状态是{{rollState}}",
          disconnectedFromPixel: "从Pixel断开连接",
          timedOutWithValue: "等待{{value}}s后超时",

          // Label printing
          carton: "大箱",
          diceSetBox: "骰子套装的箱子",
          asn: "ASN",
          example: "示例",
          productCategory: "产品分类",
          singleDie: "单骰子",
          diceSet: "骰子套装",
          productType: "产品类别",
          quantity: "数量",
          copies: "打印份数",
          print: "打印",
        },
      },
    },
  });

export default i18n;

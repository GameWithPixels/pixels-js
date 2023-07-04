import { NativeModules, Platform } from "react-native";

const LINKING_ERROR =
  `The package '@systemic-games/react-native-nordic-nrf5-dfu' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo managed workflow\n";

export default NativeModules.NordicNrf5Dfu
  ? NativeModules.NordicNrf5Dfu
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

import { Central } from "@systemic-games/react-native-bluetooth-le";

/**
 * Initialize Bluetooth.
 * @remarks It's usually best to call it on app startup. If called from within
 *          a React effect, it will be run only after the component's children
 *          effects and thus those will have to wait a frame before being
 *          able to initiate a Bluetooth scan.
 */
export function initBluetooth(): void {
  Central.initialize();
}

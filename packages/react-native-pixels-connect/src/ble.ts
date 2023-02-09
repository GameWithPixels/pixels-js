import { Central } from "@systemic-games/react-native-bluetooth-le";

export async function initializeBle() {
  await Central.initialize();
}

export async function shutdownBle() {
  await Central.shutdown();
}

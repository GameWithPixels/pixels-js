import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  install(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  "VisionCameraRgbAverages"
);

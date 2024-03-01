import { RootState } from "~/app/store";
import { PrebuildProfileName } from "~/features/pixels/PrebuildProfiles";

export function selectCustomFirmwareAndProfile(state: RootState): boolean {
  return (
    __DEV__ && (state.validationSettings.customFirmwareAndProfile ?? false)
  );
}

export function selectProfileName(state: RootState): PrebuildProfileName {
  return (
    (__DEV__ && state.validationSettings.customFirmwareAndProfile
      ? state.validationSettings.profileName
      : undefined) ?? "default"
  );
}

export function selectSkipPrintLabel(state: RootState): boolean {
  return __DEV__ && (state.validationSettings.skipPrintLabel ?? false);
}

export function selectSkipBatteryLevel(state: RootState): boolean {
  return __DEV__ && (state.validationSettings.skipBatteryLevel ?? false);
}

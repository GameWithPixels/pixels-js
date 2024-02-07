import { RootState } from "~/app/store";
import { PrebuildProfileName } from "~/features/pixels/PrebuildProfiles";

export function selectCustomFirmwareAndProfile(state: RootState): boolean {
  return state.validationSettings.customFirmwareAndProfile;
}

export function selectProfileName(state: RootState): PrebuildProfileName {
  return (
    (state.validationSettings.customFirmwareAndProfile
      ? state.validationSettings.profileName
      : undefined) ?? "default"
  );
}
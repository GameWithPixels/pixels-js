import { PrebuildProfileName } from "@systemic-games/pixels-edit-animation";

import { RootState } from "~/app/store";

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

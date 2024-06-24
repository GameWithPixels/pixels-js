import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import {
  computeProfileHashWithOverrides,
  createProfileTemplates,
} from "~/features/profiles";
import { isSameBrightness } from "~/hackGetDieBrightness";

interface ProfileTemplateInfo {
  name: string;
  brightness: number;
  hash: number;
}

const cachedTemplatesInfo = new Map<PixelDieType, ProfileTemplateInfo[]>();

function getProfileTemplateInfo(
  dieType: PixelDieType,
  profileName: string
): ProfileTemplateInfo | undefined {
  // TODO optimize to only create the template that has the same name as the profile
  let templatesInfo = cachedTemplatesInfo.get(dieType);
  if (!templatesInfo) {
    templatesInfo = createProfileTemplates(dieType).map((profile) => ({
      name: profile.name,
      brightness: profile.brightness,
      hash: computeProfileHashWithOverrides(profile),
    }));
    cachedTemplatesInfo.set(dieType, templatesInfo);
  }
  return templatesInfo.find((profile) => profile.name === profileName);
}

export function useIsModifiedDieProfile(
  profileUuid: string,
  dieType: PixelDieType
): boolean | undefined {
  const profileData = useAppSelector(
    (state) => state.library.profiles.entities[profileUuid]
  );
  const sourceProfileData = useAppSelector((state) =>
    profileData?.sourceUuid
      ? state.library.profiles.entities[profileData.sourceUuid]
      : undefined
  );
  const templateInfo =
    profileData &&
    !sourceProfileData && // No source profile indicates that a template was used
    getProfileTemplateInfo(dieType, profileData.name);
  return templateInfo
    ? profileData.hash !== templateInfo.hash ||
        !isSameBrightness(profileData.brightness, templateInfo.brightness)
    : profileData &&
        sourceProfileData &&
        (profileData.hash !== sourceProfileData.hash ||
          !isSameBrightness(
            profileData.brightness,
            sourceProfileData.brightness
          ));
}

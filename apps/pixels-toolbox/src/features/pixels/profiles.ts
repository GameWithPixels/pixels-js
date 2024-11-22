import {
  AnimConstants,
  EditActionPlayAnimation,
  EditAnimation,
  EditConditionCrooked,
  EditProfile,
  EditRule,
  PrebuildAnimations,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

export const ToolboxProfiles = [
  "megaProfile",
  ...PrebuildProfilesNames,
] as const;

export type ToolboxProfileName = (typeof ToolboxProfiles)[number];

export function createMegaProfile(
  dieType: PixelDieType,
  uuid?: string
): EditProfile {
  const profile = new EditProfile({ uuid, dieType });

  const pushAnim = function (anim: EditAnimation) {
    profile.rules.push(
      new EditRule(
        new EditConditionCrooked(),
        new EditActionPlayAnimation({
          animation: anim,
          face: AnimConstants.currentFaceIndex,
        })
      )
    );
  };

  for (const anim of Object.values(PrebuildAnimations)) {
    pushAnim(anim);
  }

  return profile;
}

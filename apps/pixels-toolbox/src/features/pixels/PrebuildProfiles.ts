import {
  EditActionPlayAnimation,
  EditConditionRolling,
  EditConditionRolled,
  EditProfile,
  EditRule,
} from "@systemic-games/pixels-edit-animation";
import {
  Constants,
  PixelDieType,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";

import { PrebuildAnimations } from "./PrebuildAnimations";
import {
  setProfileDefaultRollingRules,
  setProfileDefaultAdvancedRules,
} from "./getDefaultProfile";

export const ProfileTypes = [
  "default",
  "waterfall",
  "tiny",
  "fixedRainbow",
  "fixedRainbowD4",
  "normals",
  "video",
  "waterfallRedGreen",
  "noise",
  "spin",
  "spiral",
  "redGreenSpinning",
] as const;

export type ProfileType = (typeof ProfileTypes)[number];

export function createProfile(
  type: ProfileType,
  dieType: PixelDieType
): EditProfile {
  const profile = new EditProfile();
  setProfileDefaultAdvancedRules(profile, dieType);
  switch (type) {
    case "default":
      setProfileDefaultRollingRules(profile, dieType);
      break;
    case "waterfall": {
      profile.name = "waterfall";
      // Rolling
      profile.rules.push(
        new EditRule(new EditConditionRolling({ recheckAfter: 0.2 }), {
          actions: [
            new EditActionPlayAnimation({
              animation: PrebuildAnimations.waterfallTopHalf,
              face: Constants.currentFaceIndex,
              loopCount: 1,
            }),
          ],
        })
      );
      // All face except top one get a waterfall colored based on the face
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) => face !== DiceUtils.getTopFace(dieType)
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimations.waterfall,
                face: Constants.currentFaceIndex,
                loopCount: 1,
              }),
            ],
          }
        )
      );
      // Top face gets special waterfall
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: [DiceUtils.getTopFace(dieType)],
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimations.waterfallRainbow,
                face: Constants.currentFaceIndex,
                loopCount: 3,
              }),
            ],
          }
        )
      );
      break;
    }
    default:
      break;
  }
  return profile;
}

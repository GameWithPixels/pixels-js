import {
  EditActionPlayAnimation,
  EditConditionRolling,
  EditConditionRolled,
  EditProfile,
  EditRule,
  EditAnimation,
} from "@systemic-games/pixels-edit-animation";
import {
  Constants,
  PixelDieType,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";

import {
  PrebuildAnimations,
  PrebuildAnimationsExt,
} from "./PrebuildAnimations";
import {
  setProfileDefaultRollingRules,
  setProfileDefaultAdvancedRules,
} from "./getDefaultProfile";

export const ProfileTypes = [
  "default",
  "waterfall",
  "fountain",
  "spinning",
  "spiral",
  "noise",
  "fixedRainbow",
  "fixedRainbowD4",
  "normals",
  "video",
  "waterfallRedGreen",
  "spin",
  "redGreenSpinning",
] as const;

export type ProfileType = (typeof ProfileTypes)[number];

export function createProfile(
  type: ProfileType,
  dieType: PixelDieType
): EditProfile {
  const profile = new EditProfile();
  setProfileDefaultAdvancedRules(profile, dieType);

  const pushRollingAnimRule = function (
    anim: EditAnimation,
    count: number = 1
  ) {
    profile.rules.push(
      new EditRule(new EditConditionRolling({ recheckAfter: 0.2 }), {
        actions: [
          new EditActionPlayAnimation({
            animation: anim,
            face: Constants.currentFaceIndex,
            loopCount: count,
          }),
        ],
      })
    );
  };

  const pushRolledAnimNonTopFaceRule = function (
    anim: EditAnimation,
    count: number = 1
  ) {
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
              animation: anim,
              face: Constants.currentFaceIndex,
              loopCount: count,
            }),
          ],
        }
      )
    );
  };

  const pushRolledAnimTopFaceRule = function (
    anim: EditAnimation,
    count: number = 1
  ) {
    // All face except top one get a waterfall colored based on the face
    profile.rules.push(
      new EditRule(
        new EditConditionRolled({
          faces: [DiceUtils.getTopFace(dieType)],
        }),
        {
          actions: [
            new EditActionPlayAnimation({
              animation: anim,
              face: Constants.currentFaceIndex,
              loopCount: count,
            }),
          ],
        }
      )
    );
  };

  switch (type) {
    case "default":
      setProfileDefaultRollingRules(profile, dieType);
      break;
    case "waterfall": {
      profile.name = "waterfall";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.waterfall);
      pushRolledAnimTopFaceRule(PrebuildAnimations.waterfallRainbow, 3);
      break;
    }
    case "fountain": {
      profile.name = "fountain";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.fountain);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.rainbowFountainX3, 1);
      break;
    }
    case "spinning": {
      profile.name = "spinning";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.spinning);
      pushRolledAnimTopFaceRule(PrebuildAnimations.spinningRainbow, 1);
      break;
    }
    case "spiral": {
      profile.name = "spinning";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.spiralUpDown);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.spiralUpDownRainbow, 1);
      break;
    }
    case "noise": {
      profile.name = "noise";
      pushRollingAnimRule(PrebuildAnimations.shortNoise);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.noise);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.noiseRainbowX2, 1);
      break;
    }
    default:
      break;
  }
  return profile;
}

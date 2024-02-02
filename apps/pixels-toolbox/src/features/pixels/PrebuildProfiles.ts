import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  EditActionPlayAnimation,
  EditConditionRolling,
  EditConditionRolled,
  EditProfile,
  EditRule,
  EditAnimation,
  EditAnimationSimple,
  EditAnimationNormals,
  EditColor,
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
  "flashy",
  "highLow",
  "worm",
  "rose",
  "fire",
  "magic",
  "water",
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
    case "flashy": {
      profile.name = "flashy";
      pushRollingAnimRule(
        new EditAnimationSimple({
          ...PrebuildAnimations.whiteFlash,
          color: new EditColor("face"),
          count: 1,
          duration: 0.5,
        })
      );
      pushRolledAnimNonTopFaceRule(
        new EditAnimationSimple({
          ...PrebuildAnimations.whiteFlash,
          color: new EditColor("face"),
          count: 5,
          duration: 1,
        })
      );
      pushRolledAnimTopFaceRule(PrebuildAnimations.rainbowAllFacesFast, 2);
      break;
    }
    case "highLow": {
      profile.name = "High Low";
      pushRollingAnimRule(PrebuildAnimations.blueFlash);
      // Bottom half
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) =>
                DiceUtils.indexFromFace(face, dieType) <
                DiceUtils.getFaceCount(dieType) / 2
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimationsExt.overlappingQuickReds,
                face: Constants.currentFaceIndex,
              }),
            ],
          }
        )
      );
      // Top half
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) =>
                DiceUtils.indexFromFace(face, dieType) >=
                DiceUtils.getFaceCount(dieType) / 2
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimationsExt.overlappingQuickGreens,
                face: Constants.currentFaceIndex,
              }),
            ],
          }
        )
      );

      break;
    }
    case "worm": {
      profile.name = "Worm";
      pushRollingAnimRule(PrebuildAnimations.blueFlash);
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) =>
                DiceUtils.indexFromFace(face, dieType) <
                DiceUtils.getFaceCount(dieType) / 3
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimations.redBlueWorm,
                face: Constants.currentFaceIndex,
              }),
            ],
          }
        )
      );
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) =>
                DiceUtils.indexFromFace(face, dieType) >=
                  DiceUtils.getFaceCount(dieType) / 3 &&
                DiceUtils.indexFromFace(face, dieType) <
                  (2 * DiceUtils.getFaceCount(dieType)) / 3
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimations.pinkWorm,
                face: Constants.currentFaceIndex,
              }),
            ],
          }
        )
      );
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: DiceUtils.getDieFaces(dieType).filter(
              (face) =>
                DiceUtils.indexFromFace(face, dieType) >=
                  (2 * DiceUtils.getFaceCount(dieType)) / 3 &&
                face !== DiceUtils.getTopFace(dieType)
            ),
          }),
          {
            actions: [
              new EditActionPlayAnimation({
                animation: PrebuildAnimations.greenBlueWorm,
                face: Constants.currentFaceIndex,
              }),
            ],
          }
        )
      );
      pushRolledAnimTopFaceRule(PrebuildAnimations.rainbowFast, 1);
      break;
    }
    case "rose": {
      profile.name = "Rose";
      profile.rules.push(
        new EditRule(new EditConditionRolling({ recheckAfter: 1 }), {
          actions: [
            new EditActionPlayAnimation({
              animation: new EditAnimationNormals({
                ...PrebuildAnimations.whiteRose,
                duration: 2,
              }),
              face: DiceUtils.getTopFace(dieType),
              loopCount: 1,
            }),
          ],
        })
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.roseToCurrentFace);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.roseToCurrentFace);
      break;
    }
    case "fire": {
      profile.name = "Fire";
      profile.rules.push(
        new EditRule(new EditConditionRolling({ recheckAfter: 1 }), {
          actions: [
            new EditActionPlayAnimation({
              animation: PrebuildAnimationsExt.animatedFire,
              //              face: DiceUtils.getTopFace(dieType),
              face: Constants.currentFaceIndex,
              loopCount: 1,
            }),
          ],
        })
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.animatedFire);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.animatedFire);
      break;
    }
    case "magic": {
      profile.name = "Magic";
      profile.rules.push(
        new EditRule(new EditConditionRolling({ recheckAfter: 1 }), {
          actions: [
            new EditActionPlayAnimation({
              animation: PrebuildAnimationsExt.doubleSpinningMagic,
              //face: DiceUtils.getTopFace(dieType),
              face: Constants.currentFaceIndex,
              loopCount: 1,
            }),
          ],
        })
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.cycleMagic);
      pushRolledAnimTopFaceRule(PrebuildAnimations.cycleMagic);
      break;
    }
    case "water": {
      profile.name = "Water";
      profile.rules.push(
        new EditRule(new EditConditionRolling({ recheckAfter: 1 }), {
          actions: [
            new EditActionPlayAnimation({
              animation: PrebuildAnimations.waterBaseLayer,
              face: DiceUtils.getTopFace(dieType),
              //face: Constants.currentFaceIndex,
              loopCount: 1,
            }),
          ],
        })
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.waterSplash);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.waterSplash);
      break;
    }
    default:
      assertNever(type);
  }
  return profile;
}

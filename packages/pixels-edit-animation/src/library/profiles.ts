import {
  AnimConstants,
  DiceUtils,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { PrebuildAnimations, PrebuildAnimationsExt } from "./animations";
import {
  addDefaultAdvancedRules,
  DefaultRulesAnimations,
} from "./defaultRules";
import {
  EditActionPlayAnimation,
  EditActionSpeakText,
  EditAnimation,
  EditConditionRolled,
  EditConditionRolling,
  EditProfile,
  EditRule,
} from "../edit";

export const PrebuildProfilesNames = [
  "default",
  "empty",
  "speak",
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

export type PrebuildProfileName = (typeof PrebuildProfilesNames)[number];

export function createLibraryProfile(
  name: PrebuildProfileName,
  dieType: PixelDieType,
  uuid?: string
): EditProfile {
  const profile = new EditProfile({ uuid, dieType });
  addDefaultAdvancedRules(profile, dieType);

  // TODO fix for D4 rolling as D6
  const fixD4FaceCount = (count: number): number =>
    dieType === "d4" ? 6 : count;
  const mapFace = (face: number): number =>
    DiceUtils.mapFaceForAnimation(face, dieType);
  const mapFaces = (faces: number[]): number[] => faces.map(mapFace);

  const pushRollingAnimRule = function (
    anim: EditAnimation,
    count: number = 1
  ) {
    profile.rules.push(
      new EditRule(
        new EditConditionRolling({ recheckAfter: 0.2 }),
        new EditActionPlayAnimation({
          animation: anim,
          face: AnimConstants.currentFaceIndex,
          loopCount: count,
        })
      )
    );
  };

  const pushRolledAnimNonTopFaceRule = function (
    anim: EditAnimation,
    count = 1,
    duration?: number
  ) {
    profile.rules.push(
      new EditRule(
        new EditConditionRolled({
          faces: mapFaces(
            DiceUtils.getDieFaces(dieType).filter(
              (face) => face !== DiceUtils.getTopFace(dieType)
            )
          ),
        }),
        new EditActionPlayAnimation({
          animation: anim,
          face: AnimConstants.currentFaceIndex,
          loopCount: count,
          duration,
        })
      )
    );
  };

  const pushRolledAnimTopFaceRule = function (anim: EditAnimation, count = 1) {
    profile.rules.push(
      new EditRule(
        new EditConditionRolled({
          faces: [mapFace(DiceUtils.getTopFace(dieType))],
        }),
        new EditActionPlayAnimation({
          animation: anim,
          face: AnimConstants.currentFaceIndex,
          loopCount: count,
        })
      )
    );
  };

  switch (name) {
    case "default":
      profile.name = "Default Profile";
      profile.description = "The default profile for all dice.";
      // Rolling
      profile.rules.push(
        new EditRule(
          new EditConditionRolling({ recheckAfter: 0.5 }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.coloredFlash, // Validation default: Rolling Anim
            face: AnimConstants.currentFaceIndex,
            loopCount: 1,
          })
        )
      );
      // OnFace
      pushRolledAnimTopFaceRule(DefaultRulesAnimations.hello); // Validation default: Rainbow All Faces
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  face !== DiceUtils.getTopFace(dieType) &&
                  face !== DiceUtils.getBottomFace(dieType)
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.waterfall,
            face: AnimConstants.currentFaceIndex,
          })
        )
      );
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: [mapFace(DiceUtils.getBottomFace(dieType))],
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.quickRed,
            // Validation default: Long Red blink
          })
        )
      );
      break;

    // case "firmware":
    //   profile.name = "Default";
    //   profile.description = "The default profile for all dice.";
    //   addDefaultRollingRules(profile, dieType);
    //   break;

    case "empty":
      profile.name = "Empty";
      profile.description = "An empty profile to start fresh.";
      break;

    case "speak":
      profile.name = "Speak Numbers";
      profile.description =
        "This profile has your device say the rolled numbers out loud (when the app is open)";
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.noise);
      pushRolledAnimTopFaceRule(PrebuildAnimations.noiseRainbow);
      profile.rules.push(
        ...DiceUtils.getDieFaces(dieType).map(
          (f) =>
            new EditRule(
              new EditConditionRolled({
                faces: [f],
              }),
              new EditActionSpeakText({
                text: f.toString(),
              })
            )
        )
      );
      break;

    case "waterfall": {
      profile.name = "Waterfall";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.waterfall);
      pushRolledAnimTopFaceRule(PrebuildAnimations.waterfallRainbow, 3);
      break;
    }

    case "fountain": {
      profile.name = "Fountain";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.fountain);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.rainbowFountainX3, 1);
      break;
    }

    case "spinning": {
      profile.name = "Spinning";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.spinning);
      pushRolledAnimTopFaceRule(PrebuildAnimations.spinningRainbow, 1);
      break;
    }

    case "spiral": {
      profile.name = "Spiral";
      pushRollingAnimRule(PrebuildAnimations.waterfallTopHalf);
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.spiralUpDown);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.spiralUpDownRainbow, 1);
      break;
    }

    case "noise": {
      profile.name = "Noise";
      pushRollingAnimRule(PrebuildAnimations.shortNoise);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.noise);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.noiseRainbowX2, 1);
      break;
    }

    case "flashy": {
      profile.name = "Flashy";
      pushRollingAnimRule(PrebuildAnimations.coloredFlash);
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.coloredFlash, 5, 1);
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
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  DiceUtils.indexFromFace(face, dieType) <
                  fixD4FaceCount(DiceUtils.getFaceCount(dieType)) / 2
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimationsExt.overlappingQuickReds,
            face: AnimConstants.currentFaceIndex,
          })
        )
      );
      // Top half
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  DiceUtils.indexFromFace(face, dieType) >=
                  fixD4FaceCount(DiceUtils.getFaceCount(dieType)) / 2
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimationsExt.overlappingQuickGreens,
            face: AnimConstants.currentFaceIndex,
          })
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
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  DiceUtils.indexFromFace(face, dieType) <
                  fixD4FaceCount(DiceUtils.getFaceCount(dieType)) / 3
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.redBlueWorm,
            face: AnimConstants.currentFaceIndex,
          })
        )
      );
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  DiceUtils.indexFromFace(face, dieType) >=
                    fixD4FaceCount(DiceUtils.getFaceCount(dieType)) / 3 &&
                  DiceUtils.indexFromFace(face, dieType) <
                    (2 * fixD4FaceCount(DiceUtils.getFaceCount(dieType))) / 3
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.pinkWorm,
            face: AnimConstants.currentFaceIndex,
          })
        )
      );
      profile.rules.push(
        new EditRule(
          new EditConditionRolled({
            faces: mapFaces(
              DiceUtils.getDieFaces(dieType).filter(
                (face) =>
                  DiceUtils.indexFromFace(face, dieType) >=
                    (2 * fixD4FaceCount(DiceUtils.getFaceCount(dieType))) / 3 &&
                  face !== DiceUtils.getTopFace(dieType)
              )
            ),
          }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.greenBlueWorm,
            face: AnimConstants.currentFaceIndex,
          })
        )
      );
      pushRolledAnimTopFaceRule(PrebuildAnimations.rainbowFast, 1);
      break;
    }

    case "rose": {
      profile.name = "Rose";
      profile.rules.push(
        new EditRule(
          new EditConditionRolling({ recheckAfter: 1 }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.whiteRose,
            face: mapFace(DiceUtils.getTopFace(dieType)),
            loopCount: 1,
            duration: 2,
          })
        )
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.roseToCurrentFace);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.roseToCurrentFace);
      break;
    }

    case "fire": {
      profile.name = "Fire";
      profile.rules.push(
        new EditRule(
          new EditConditionRolling({ recheckAfter: 1 }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimationsExt.fire,
            // face: fixD4Face(DiceUtils.getTopFace(dieType)),
            face: AnimConstants.currentFaceIndex,
            loopCount: 1,
          })
        )
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.fire);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.fire);
      break;
    }

    case "magic": {
      profile.name = "Magic";
      profile.rules.push(
        new EditRule(
          new EditConditionRolling({ recheckAfter: 1 }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimationsExt.doubleSpinningMagic,
            //face: fixD4Face(DiceUtils.getTopFace(dieType)),
            face: AnimConstants.currentFaceIndex,
            loopCount: 1,
          })
        )
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimations.cycleMagic);
      pushRolledAnimTopFaceRule(PrebuildAnimations.cycleMagic);
      break;
    }

    case "water": {
      profile.name = "Water";
      profile.rules.push(
        new EditRule(
          new EditConditionRolling({ recheckAfter: 1 }),
          new EditActionPlayAnimation({
            animation: PrebuildAnimations.waterBaseLayer,
            face: mapFace(DiceUtils.getTopFace(dieType)),
            //face: Constants.currentFaceIndex,
            loopCount: 1,
          })
        )
      );
      pushRolledAnimNonTopFaceRule(PrebuildAnimationsExt.waterSplash);
      pushRolledAnimTopFaceRule(PrebuildAnimationsExt.waterSplash);
      break;
    }
    default:
      assertNever(name);
  }

  return profile;
}

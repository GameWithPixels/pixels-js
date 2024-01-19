import {
  Constants,
  DiceUtils,
  PixelDieType,
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";

import { readAnimation } from "../store/profiles";
import { generateUuid } from "../utils";

import { LibraryState } from "~/app/store";

export function createProfileTemplates(
  dieType: PixelDieType,
  library: LibraryState
): Profiles.Profile[] {
  const animationsMap = new Map(
    Object.values(library.animations)
      .flatMap(
        (a) => (Object.values(a.entities) as Serializable.AnimationData[]) ?? []
      )
      .map((a) => [a.name, a.uuid])
  );
  const getAnim = (name: string): Profiles.Animation | undefined => {
    const uuid = animationsMap.get(name);
    if (!uuid) {
      console.warn(`Animation ${name} not found`);
    } else {
      return readAnimation(uuid, library);
    }
  };
  const topFace = DiceUtils.getTopFace(dieType);
  const allFaces = DiceUtils.getDieFaces(dieType);
  const allButTopFaces = allFaces.filter((f) => f !== topFace);
  return [
    new Profiles.Profile({
      uuid: generateUuid(),
      name: "Colorful",
      description: "This profile lights up a different color for every face.",
      dieType,
      rules: [
        new Profiles.Rule(
          new Profiles.ConditionRolled({
            faces: [topFace],
          }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Rainbow"),
            face: Constants.currentFaceIndex,
          })
        ),
        new Profiles.Rule(
          new Profiles.ConditionRolled({
            faces: allButTopFaces,
          }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Waterfall"),
            face: Constants.currentFaceIndex,
          })
        ),
        new Profiles.Rule(
          new Profiles.ConditionRolling({ recheckAfter: 1 }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Face Up"),
            face: Constants.currentFaceIndex,
            duration: 0.5,
          })
        ),
      ],
    }),
    new Profiles.Profile({
      uuid: generateUuid(),
      name: "Flashy",
      description: "Most of the animations in this profile have flashes!",
      dieType,
      rules: [
        new Profiles.Rule(
          new Profiles.ConditionRolled({
            faces: [topFace],
          }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Rainbow Fast"),
            face: Constants.currentFaceIndex,
          })
        ),
        new Profiles.Rule(
          new Profiles.ConditionRolled({
            faces: allButTopFaces,
          }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Noise"),
            face: Constants.currentFaceIndex,
          })
        ),
        new Profiles.Rule(
          new Profiles.ConditionRolling({ recheckAfter: 1 }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Short Noise"),
            face: Constants.currentFaceIndex,
            duration: 0.5,
          })
        ),
      ],
    }),
    new Profiles.Profile({
      uuid: generateUuid(),
      name: "Speak Numbers",
      description:
        "This profile has your device say the rolled numbers out loud (when the app is open)",
      dieType,
      rules: [
        new Profiles.Rule(
          new Profiles.ConditionRolled({
            faces: allFaces,
          }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Face Colored Blink"),
            face: Constants.currentFaceIndex,
          })
        ),
        ...allFaces.map(
          (f) =>
            new Profiles.Rule(
              new Profiles.ConditionRolled({
                faces: [f],
              }),
              new Profiles.ActionSpeakText({
                text: f.toString(),
              })
            )
        ),
        new Profiles.Rule(
          new Profiles.ConditionRolling({ recheckAfter: 1 }),
          new Profiles.ActionPlayAnimation({
            animation: getAnim("Rainbow Pulses"),
            face: Constants.currentFaceIndex,
            duration: 0.5,
          })
        ),
      ],
    }),
  ];
}

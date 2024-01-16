import {
  Constants,
  DiceUtils,
  PixelDieType,
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";

import { addFactoryAdvancedRules } from "../store/library/factory";
import { readAnimation } from "../store/profiles";

import { LibraryState } from "~/app/store";
import { generateUuid } from "~/features/utils";

export function createDefaultProfiles(
  dieType: PixelDieType,
  library: LibraryState
): {
  profiles: Profiles.Profile[];
  animations: Profiles.Animation[];
  patterns: Profiles.Pattern[];
  gradients: Profiles.RgbGradient[];
} {
  const animationsMap = new Map(
    Object.values(library.animations)
      .flatMap(
        (a) => (Object.values(a.entities) as Serializable.AnimationData[]) ?? []
      )
      .map((a) => [a.name, a.uuid])
  );
  const getAnim = (name: string): Profiles.Animation => {
    const anim = animations.find((a) => a.name === name);
    if (anim) {
      return anim;
    }
    const uuid = animationsMap.get(name);
    if (!uuid) {
      throw new Error(`Animation ${name} not found`);
    }
    return readAnimation(uuid, library, true);
  };
  const animations = [
    new Profiles.AnimationRainbow({
      uuid: generateUuid(),
      name: "Rainbow Pulses",
      category: "colorful",
      fade: 1,
      cycles: 2,
      duration: 2,
    }),
  ];
  return {
    profiles: [
      addFactoryAdvancedRules(
        new Profiles.Profile({
          uuid: generateUuid(),
          name: "Simple",
          description: "A simple profile",
          dieType,
          rules: [
            new Profiles.Rule(
              new Profiles.ConditionRolled({
                faces: DiceUtils.getDieFaces(dieType),
              }),
              new Profiles.ActionPlayAnimation({
                animation: getAnim("Waterfall"),
                face: Constants.currentFaceIndex,
              })
            ),
            new Profiles.Rule(
              new Profiles.ConditionRolling({ recheckAfter: 8 }),
              new Profiles.ActionPlayAnimation({
                animation: getAnim("Rainbow Pulses"),
                face: Constants.currentFaceIndex,
                duration: 5,
              })
            ),
          ],
        }),
        (uuid) => readAnimation(uuid, library, true)
      ),
    ],
    animations,
    patterns: [],
    gradients: [],
  };
}

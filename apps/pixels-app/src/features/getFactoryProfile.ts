import { DiceUtils, PixelDieType } from "@systemic-games/pixels-core-connect";
import {
  AnimationFlagsValues,
  BatteryStateFlagsValues,
  Color,
  ConnectionStateFlagsValues,
  Constants,
  EditActionPlayAnimation,
  EditAnimationRainbow,
  EditAnimationSimple,
  EditColor,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionHelloGoodbye,
  EditConditionRolled,
  EditConditionRolling,
  EditProfile,
  EditRule,
  getFaceMask,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-edit-animation";

const profiles = new Map<PixelDieType, EditProfile>();

export function getDefaultProfile(
  dieType: PixelDieType
): Readonly<EditProfile> {
  if (!dieType || dieType === "unknown") {
    // Assume D20 for unknown die type for now
    dieType = "d20";
  }
  const profile = profiles.get(dieType);
  if (profile) {
    return profile;
  } else {
    const newProfile = createDefaultProfile(dieType);
    profiles.set(dieType, newProfile);
    return newProfile;
  }
}

export function getFactoryProfileByUuid(
  uuid: string
): Readonly<EditProfile> | undefined {
  if (isFactoryProfile(uuid)) {
    const dieType = uuid.substring("factory".length) as PixelDieType;
    return getDefaultProfile(dieType);
  }
}

export function isFactoryProfile(uuid: string): boolean {
  return uuid.startsWith("factory");
}

function createDefaultProfile(dieType: PixelDieType): EditProfile {
  const profile = new EditProfile({
    uuid: "factory" + dieType,
    name: "Default Profile",
    description: "Your die is configured with the default Profile.",
    dieType,
  });
  // Hello
  profile.rules.push(
    new EditRule(
      new EditConditionHelloGoodbye({ flags: HelloGoodbyeFlagsValues.hello }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationRainbow({
              animFlags:
                AnimationFlagsValues.traveling |
                AnimationFlagsValues.useLedIndices,
              duration: 2.0,
              faces: Constants.faceMaskAll,
              count: 2,
              fade: 200 / 255,
              intensity: 0x80 / 255,
              cycles: 1,
            }),
            face: Constants.currentFaceIndex,
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Rolling
  profile.rules.push(
    new EditRule(new EditConditionRolling({ recheckAfter: 0.5 }), {
      actions: [
        new EditActionPlayAnimation({
          animation: new EditAnimationSimple({
            count: 1,
            duration: 0.1,
            color: new EditColor("face"),
            faces: getFaceMask(DiceUtils.getTopFace(dieType), dieType),
          }),
          face: Constants.currentFaceIndex,
          loopCount: 1,
        }),
      ],
    })
  );

  // OnFace
  profile.rules.push(
    new EditRule(
      new EditConditionRolled({
        faces: DiceUtils.getDieFaces(dieType),
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 1,
              duration: 3,
              color: new EditColor("face"),
              faces: Constants.faceMaskAll,
            }),
            face: Constants.currentFaceIndex,
            loopCount: 1,
          }),
        ],
      }
    )
  );

  addDefaultAdvancedRules(profile);

  return profile;
}

export function addDefaultAdvancedRules(profile: EditProfile): EditProfile {
  const dieType = profile.dieType ?? "d20";

  // Connection
  profile.rules.push(
    new EditRule(
      new EditConditionConnectionState({
        flags:
          ConnectionStateFlagsValues.connected |
          ConnectionStateFlagsValues.disconnected,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 2,
              duration: 1,
              color: Color.blue,
              faces: Constants.faceMaskAll,
            }),
            face: Constants.currentFaceIndex,
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Low Batt
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.low,
        recheckAfter: 30,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 3,
              duration: 1.5,
              color: Color.red,
              faces: Constants.faceMaskAll,
            }),
            face: Constants.currentFaceIndex,
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Charging
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.charging,
        recheckAfter: 5,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 1,
              duration: 3,
              color: Color.red,
              faces: getFaceMask(DiceUtils.getTopFace(dieType), dieType),
            }),
            face: DiceUtils.getTopFace(dieType),
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Fully Charged
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.done,
        recheckAfter: 5,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 1,
              duration: 3,
              color: Color.green,
              faces: getFaceMask(DiceUtils.getTopFace(dieType), dieType),
            }),
            face: DiceUtils.getTopFace(dieType),
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Bad Charging
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.badCharging,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 10,
              duration: 2,
              color: Color.red,
              faces: Constants.faceMaskAll,
            }),
            face: DiceUtils.getTopFace(dieType),
            loopCount: 1,
          }),
        ],
      }
    )
  );

  // Charging Error
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.error,
        recheckAfter: 1.5,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 1,
              duration: 1,
              color: Color.yellow,
              faces: getFaceMask(DiceUtils.getTopFace(dieType), dieType),
            }),
            face: DiceUtils.getTopFace(dieType),
            loopCount: 1,
          }),
        ],
      }
    )
  );

  return profile;
}

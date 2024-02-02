import { DiceUtils } from "@systemic-games/pixels-core-connect";
import {
  DataSet,
  createDataSetForProfile,
  EditActionPlayAnimation,
  EditAnimationRainbow,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  EditProfile,
  EditRule,
  EditConditionConnectionState,
  EditAnimationSimple,
  EditConditionRolling,
  EditColor,
  EditConditionBatteryState,
} from "@systemic-games/pixels-edit-animation";
import {
  Color,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
  Constants,
  ConnectionStateFlagsValues,
  AnimationFlagsValues,
  getFaceMask,
  BatteryStateFlagsValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export function setProfileDefaultRollingRules(
  profile: EditProfile,
  dieType: PixelDieType
) {
  // Rolling
  profile.rules.push(
    new EditRule(new EditConditionRolling({ recheckAfter: 0.5 }), {
      actions: [
        new EditActionPlayAnimation({
          animation: new EditAnimationSimple({
            count: 1,
            duration: 0.1,
            fade: 0.5,
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
      new EditConditionFaceCompare({
        flags: FaceCompareFlagsValues.equal | FaceCompareFlagsValues.greater,
        face: 0,
      }),
      {
        actions: [
          new EditActionPlayAnimation({
            animation: new EditAnimationSimple({
              count: 1,
              duration: 3,
              fade: 0.5,
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
}

export function setProfileDefaultAdvancedRules(
  profile: EditProfile,
  dieType: PixelDieType
) {
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
              fade: 0.5,
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
              fade: 0.5,
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
              fade: 0.5,
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
              fade: 0.5,
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
              fade: 0.5,
              faces: getFaceMask(DiceUtils.getTopFace(dieType), dieType),
            }),
            face: DiceUtils.getTopFace(dieType),
            loopCount: 1,
          }),
        ],
      }
    )
  );
}

export function getDefaultProfile(dieType: PixelDieType): EditProfile {
  const profile = new EditProfile();
  profile.name = "default";

  // Add simplest rolling rules
  setProfileDefaultRollingRules(profile, dieType);

  // Add advanced rules
  setProfileDefaultAdvancedRules(profile, dieType);

  return profile;
}

export function getDefaultDataset(dieType: PixelDieType): DataSet {
  const profile = getDefaultProfile(dieType);
  const dataSet: DataSet = createDataSetForProfile(profile).toDataSet();
  return dataSet;
}

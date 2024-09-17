import {
  AnimationFlagsValues,
  BatteryStateFlagsValues,
  Color,
  ConnectionStateFlagsValues,
  AnimConstants,
  DiceUtils,
  getFaceMask,
  HelloGoodbyeFlagsValues,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import {
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
} from "../edit";

const AnimFlashes = EditAnimationSimple;
const AnimRainbow = EditAnimationRainbow;

const rolledUuid = "39ea1031-aa66-429e-b9e1-25c6f6994b17";
const helloUuid = "1ab1bf75-dcf7-4302-979b-764323ce5037";
const connectionUuid = "1bcf17ca-0f7e-4c87-80eb-e8a0c09541b7";
const batteryLowUuid = "f042e65f-2fc2-4789-8e3e-9b580333bde6";
const batteryBadChargingUuid = "ede414a7-f6bd-4c24-a7fd-6fd88c83519f";

const rollingUuids = {
  unknown: "5beea06a-7c51-4c46-9bf2-61fbe4ba5f13",
  d20: "c6025f51-0158-4479-b43c-cdcdc435126a",
  d12: "de08a8f6-398f-47dc-b52e-59d1f84c6283",
  d10: "e3c735f4-7e73-491c-8c41-44e515422afb",
  d00: "d41a05ca-725a-4057-bb6d-7a51c49d0373",
  d8: "fb0822a0-5459-47ec-a806-dd2886edbd19",
  d6: "d519c8ac-db86-4bc9-8d4d-fed090967e48",
  d4: "0e531bd1-3d2d-4100-9102-13c223d552fa",
  d6pipped: "a782440a-94e9-40e8-b8ea-1b764bb58f39",
  d6fudge: "71dd5254-9a32-40f8-874c-74762ae4531a",
} as const;

const batteryChargedUuids = {
  unknown: "57269ea4-479e-4d13-80c4-2e6f26800730",
  d20: "2978a685-7ad2-47bb-9303-eefd4d07b179",
  d12: "8ed52163-57ef-4783-aded-1ab2a29ea4b0",
  d10: "5ed9db02-6506-440f-9028-1a05806ddb82",
  d00: "2b70075b-f69c-4ba5-a099-7be31077409b",
  d8: "6281b9d5-8a3b-47e7-96ae-38333f3d9fdc",
  d6: "30eb97fe-606f-468b-bc5b-bcd2b3a201f9",
  d4: "82d10019-10c2-49e7-bd8d-d0bcbb5f9b0b",
  d6pipped: "43463c71-f962-4f7d-92af-94249a8d6d87",
  d6fudge: "bf85fd4c-976f-4e76-ac8f-dffe1796fa85",
} as const;

const batteryChargingUuids = {
  unknown: "3649fb32-b9bc-45bb-ad7b-e18f45559a90",
  d20: "2068b1ff-f68e-4c20-9302-6f922af646e1",
  d12: "9e16d056-1eeb-49e6-a3e3-7a0879ef6a38",
  d10: "a04dbefd-e0f2-4a4e-9975-9b098ef0240a",
  d00: "f0d657ed-8eee-4044-ae4e-9e1c3ba40ff5",
  d8: "6131a957-e211-4db6-8189-9a69fe8524ae",
  d6: "cba30d1d-f7f8-46de-a2d4-457b9630b367",
  d4: "f57c7553-cd9c-46ac-9904-e3ae92b8f4f7",
  d6pipped: "1542147c-74bf-4e94-b39d-2ffd96babb5c",
  d6fudge: "40f6174b-f727-4a7a-8973-631d60ac80c9",
} as const;

const batteryErrorUuids = {
  unknown: "604ab883-d51f-4d12-a51f-5cd18d5f8407",
  d20: "82c272a9-07bd-4e63-a61f-5d50bd6da83c",
  d12: "2e383de7-2524-4d5e-9b7e-c9f02bfcc637",
  d10: "b6d994e2-84a2-45f2-a1a9-5b780e1788bc",
  d00: "65dc972a-8412-4081-9bf3-b97e528845dd",
  d8: "b2612c86-bd2f-4136-933b-138e31243e25",
  d6: "6b5be284-4d4d-4104-9e2c-c643f79c85a1",
  d4: "2d6a4470-4693-4aae-bc90-c57e3e8a18a3",
  d6pipped: "b9966abb-e031-4d44-aee8-c4f52ce58512",
  d6fudge: "fbf1fc13-f707-4265-a696-35c92105690a",
} as const;

function rolling(dieType: PixelDieType) {
  return new AnimFlashes({
    name: "Face Up",
    uuid: rollingUuids[dieType],
    category: "uniform",
    dieType,
    duration: 0.1,
    count: 1,
    fade: 0.5,
    color: new EditColor("face"),
    faces: getFaceMask(DiceUtils.getHighestFace(dieType), dieType),
  });
}

function charging(dieType: PixelDieType) {
  return new AnimFlashes({
    name: "Charging",
    uuid: batteryChargingUuids[dieType],
    dieType,
    duration: 3,
    count: 1,
    color: Color.red,
    fade: 0.5,
    faces: getFaceMask(DiceUtils.getHighestFace(dieType), dieType),
  });
}

function charged(dieType: PixelDieType) {
  return new AnimFlashes({
    name: "Fully Charged",
    uuid: batteryChargedUuids[dieType],
    dieType,
    duration: 3,
    count: 1,
    color: Color.green,
    fade: 0.5,
    faces: getFaceMask(DiceUtils.getHighestFace(dieType), dieType),
  });
}

function chargingError(dieType: PixelDieType) {
  return new AnimFlashes({
    name: "Charging Error",
    uuid: batteryErrorUuids[dieType],
    dieType,
    duration: 1,
    count: 1,
    color: Color.yellow,
    fade: 0.5,
    faces: getFaceMask(DiceUtils.getHighestFace(dieType), dieType),
  });
}

export const DefaultRulesAnimations = {
  hello: new AnimRainbow({
    name: "Rolling Rainbow",
    uuid: helloUuid,
    category: "colorful",
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    duration: 2.0,
    faces: AnimConstants.faceMaskAll,
    count: 2,
    fade: 200 / 255,
    intensity: 0x80 / 255,
    cycles: 1,
  }),

  rolling: {
    unknown: rolling("unknown"),
    d20: rolling("d20"),
    d12: rolling("d12"),
    d10: rolling("d10"),
    d00: rolling("d00"),
    d8: rolling("d8"),
    d6: rolling("d6"),
    d4: rolling("d4"),
    d6pipped: rolling("d6pipped"),
    d6fudge: rolling("d6fudge"),
  },

  rolled: new AnimFlashes({
    name: "Face Colored Blink",
    uuid: rolledUuid,
    category: "uniform",
    count: 1,
    duration: 3,
    fade: 0.5,
    color: new EditColor("face"),
    faces: AnimConstants.faceMaskAll,
  }),

  connection: new AnimFlashes({
    name: "Connection",
    uuid: connectionUuid,
    count: 2,
    duration: 1,
    fade: 0.5,
    color: Color.blue,
    faces: AnimConstants.faceMaskAll,
  }),

  lowBattery: new AnimFlashes({
    name: "Low Battery",
    uuid: batteryLowUuid,
    count: 3,
    duration: 1.5,
    color: Color.red,
    faces: AnimConstants.faceMaskAll,
  }),

  charging: {
    unknown: charging("unknown"),
    d20: charging("d20"),
    d12: charging("d12"),
    d10: charging("d10"),
    d00: charging("d00"),
    d8: charging("d8"),
    d6: charging("d6"),
    d4: charging("d4"),
    d6pipped: charging("d6pipped"),
    d6fudge: charging("d6fudge"),
  },

  charged: {
    unknown: charged("unknown"),
    d20: charged("d20"),
    d12: charged("d12"),
    d10: charged("d10"),
    d00: charged("d00"),
    d8: charged("d8"),
    d6: charged("d6"),
    d4: charged("d4"),
    d6pipped: charged("d6pipped"),
    d6fudge: charged("d6fudge"),
  },

  badCharging: new AnimFlashes({
    name: "Bad Charging",
    uuid: batteryBadChargingUuid,
    count: 10,
    duration: 2,
    color: Color.red,
    fade: 0.5,
    faces: AnimConstants.faceMaskAll,
  }),

  chargingError: {
    unknown: chargingError("unknown"),
    d20: chargingError("d20"),
    d12: chargingError("d12"),
    d10: chargingError("d10"),
    d00: chargingError("d00"),
    d8: chargingError("d8"),
    d6: chargingError("d6"),
    d4: chargingError("d4"),
    d6pipped: chargingError("d6pipped"),
    d6fudge: chargingError("d6fudge"),
  },
};

export function addDefaultRollingRules(
  profile: EditProfile,
  dieType: PixelDieType
) {
  // Rolling
  profile.rules.push(
    new EditRule(
      new EditConditionRolling({ recheckAfter: 0.5 }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.rolling[dieType],
        face: AnimConstants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );
  // OnFace
  profile.rules.push(
    new EditRule(
      new EditConditionRolled({
        faces: DiceUtils.getDieFaces(profile.dieType),
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.rolled,
        face: AnimConstants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );
}

export function addDefaultAdvancedRules(
  profile: EditProfile,
  dieType: PixelDieType
) {
  const mapFace = (face: number): number =>
    DiceUtils.mapFaceForAnimation(face, dieType);

  // Hello
  profile.rules.push(
    new EditRule(
      new EditConditionHelloGoodbye({ flags: HelloGoodbyeFlagsValues.hello }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.hello,
        face: AnimConstants.currentFaceIndex,
        loopCount: 1,
      })
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
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.connection,
        face: AnimConstants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );
  // Low Batt
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.low,
        recheckAfter: 30,
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.lowBattery,
        face: AnimConstants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );

  // Charging
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.charging,
        recheckAfter: 5,
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.charging[dieType],
        face: mapFace(DiceUtils.getHighestFace(dieType)),
        loopCount: 1,
      })
    )
  );

  // Fully Charged
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.done,
        recheckAfter: 5,
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.charged[dieType],
        face: mapFace(DiceUtils.getHighestFace(dieType)),
        loopCount: 1,
      })
    )
  );

  // Bad Charging
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.badCharging,
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.badCharging,
        face: mapFace(DiceUtils.getHighestFace(dieType)),
        loopCount: 1,
      })
    )
  );

  // Charging Error
  profile.rules.push(
    new EditRule(
      new EditConditionBatteryState({
        flags: BatteryStateFlagsValues.error,
        recheckAfter: 1.5,
      }),
      new EditActionPlayAnimation({
        animation: DefaultRulesAnimations.chargingError[dieType],
        face: mapFace(DiceUtils.getHighestFace(dieType)),
        loopCount: 1,
      })
    )
  );
}

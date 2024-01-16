import { assert } from "@systemic-games/pixels-core-utils";
import {
  Color,
  Constants,
  DiceUtils,
  getFaceMask,
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

// Stable list of dice types, the order is important has
// it matches the order of the profiles and animations UUIDs
// TODO switch to a map with the UUIDs as values
const dieTypesStable: readonly PixelDieType[] = [
  "d20",
  "d12",
  "d10",
  "d00",
  "d8",
  "d6",
  "d4",
  "d6pipped",
  "d6fudge",
] as const;

const rolledUuid = "39ea1031-aa66-429e-b9e1-25c6f6994b17";
const helloUuid = "1ab1bf75-dcf7-4302-979b-764323ce5037";
const connectedUuid = "1bcf17ca-0f7e-4c87-80eb-e8a0c09541b7";
const batteryLowUuid = "f042e65f-2fc2-4789-8e3e-9b580333bde6";
const batteryBadChargingUuid = "ede414a7-f6bd-4c24-a7fd-6fd88c83519f";

const profilesUuids = [
  "3a1997bd-5a10-4475-a7f5-57d8f1a7e6c5",
  "d5b70abf-0f3d-450a-a43e-07781de25762",
  "9f4f4365-4c41-42b6-9c66-25a603470702",
  "c9562fb9-0fc1-43a6-81ed-fa6caec8f781",
  "d2ce420e-1c38-47a5-b9ba-10d27b06a56c",
  "9291dbb5-f864-4f94-bfb7-e035b8a914f4",
  "0b02249f-0476-466f-8115-18addf754047",
  "e167fd5b-30d5-45f7-a841-316d4acae5a1",
  "99f2b7d7-fbd1-47d9-b7a3-a4e90d806ff9",
] as const;
assert(
  profilesUuids.length === dieTypesStable.length,
  "Unexpected profilesUuids length"
);

const rollingUuids = [
  "c6025f51-0158-4479-b43c-cdcdc435126a",
  "de08a8f6-398f-47dc-b52e-59d1f84c6283",
  "e3c735f4-7e73-491c-8c41-44e515422afb",
  "d41a05ca-725a-4057-bb6d-7a51c49d0373",
  "fb0822a0-5459-47ec-a806-dd2886edbd19",
  "d519c8ac-db86-4bc9-8d4d-fed090967e48",
  "0e531bd1-3d2d-4100-9102-13c223d552fa",
  "a782440a-94e9-40e8-b8ea-1b764bb58f39",
  "71dd5254-9a32-40f8-874c-74762ae4531a",
] as const;
assert(
  rollingUuids.length === dieTypesStable.length,
  "Unexpected rollingUuids length"
);

const batteryDoneUuids = [
  "2978a685-7ad2-47bb-9303-eefd4d07b179",
  "8ed52163-57ef-4783-aded-1ab2a29ea4b0",
  "5ed9db02-6506-440f-9028-1a05806ddb82",
  "2b70075b-f69c-4ba5-a099-7be31077409b",
  "6281b9d5-8a3b-47e7-96ae-38333f3d9fdc",
  "30eb97fe-606f-468b-bc5b-bcd2b3a201f9",
  "82d10019-10c2-49e7-bd8d-d0bcbb5f9b0b",
  "43463c71-f962-4f7d-92af-94249a8d6d87",
  "bf85fd4c-976f-4e76-ac8f-dffe1796fa85",
] as const;
assert(
  batteryDoneUuids.length === dieTypesStable.length,
  "Unexpected batteryDoneUuids length"
);

const batteryChargingUuids = [
  "2068b1ff-f68e-4c20-9302-6f922af646e1",
  "9e16d056-1eeb-49e6-a3e3-7a0879ef6a38",
  "a04dbefd-e0f2-4a4e-9975-9b098ef0240a",
  "f0d657ed-8eee-4044-ae4e-9e1c3ba40ff5",
  "6131a957-e211-4db6-8189-9a69fe8524ae",
  "cba30d1d-f7f8-46de-a2d4-457b9630b367",
  "f57c7553-cd9c-46ac-9904-e3ae92b8f4f7",
  "1542147c-74bf-4e94-b39d-2ffd96babb5c",
  "40f6174b-f727-4a7a-8973-631d60ac80c9",
] as const;
assert(
  batteryChargingUuids.length === dieTypesStable.length,
  "Unexpected batteryChargingUuids length"
);

const batteryErrorUuids = [
  "82c272a9-07bd-4e63-a61f-5d50bd6da83c",
  "2e383de7-2524-4d5e-9b7e-c9f02bfcc637",
  "b6d994e2-84a2-45f2-a1a9-5b780e1788bc",
  "65dc972a-8412-4081-9bf3-b97e528845dd",
  "b2612c86-bd2f-4136-933b-138e31243e25",
  "6b5be284-4d4d-4104-9e2c-c643f79c85a1",
  "2d6a4470-4693-4aae-bc90-c57e3e8a18a3",
  "b9966abb-e031-4d44-aee8-c4f52ce58512",
  "fbf1fc13-f707-4265-a696-35c92105690a",
] as const;
assert(
  batteryErrorUuids.length === dieTypesStable.length,
  "Unexpected batteryErrorUuids length"
);

export function getFactoryProfileUuid(dieType: PixelDieType): string {
  return profilesUuids[dieTypesStable.indexOf(dieType)] ?? profilesUuids[0];
}

export function isFactoryProfileUuid(uuid: string): boolean {
  return profilesUuids.includes(uuid as any);
}

export type FactoryAnimationName =
  | "hello"
  | "rolling"
  | "rolled"
  | "connection"
  | "batteryLow"
  | "batteryCharging"
  | "batteryDone"
  | "batteryBadCharging"
  | "batteryError";

export function getFactoryAnimationUuid(
  name: FactoryAnimationName,
  dieType: PixelDieType
): string {
  switch (name) {
    case "hello":
      return helloUuid;
    case "rolling":
      return rollingUuids[dieTypesStable.indexOf(dieType)];
    case "rolled":
      return rolledUuid;
    case "connection":
      return connectedUuid;
    case "batteryLow":
      return batteryLowUuid;
    case "batteryCharging":
      return batteryChargingUuids[dieTypesStable.indexOf(dieType)];
    case "batteryDone":
      return batteryDoneUuids[dieTypesStable.indexOf(dieType)];
    case "batteryBadCharging":
      return batteryBadChargingUuid;
    case "batteryError":
      return batteryErrorUuids[dieTypesStable.indexOf(dieType)];
  }
}

function addFactoryBaseRules(
  profile: Profiles.Profile,
  getAnimation: (name: FactoryAnimationName) => Profiles.Animation
): void {
  // Hello
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionHelloGoodbye({
        flags: Profiles.HelloGoodbyeFlagsValues.hello,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("hello"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );

  // Rolling
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionRolling({ recheckAfter: 0.5 }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("rolling"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );

  // OnFace
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionRolled({
        faces: DiceUtils.getDieFaces(profile.dieType),
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("rolled"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );
}

export function addFactoryAdvancedRules(
  profile: Profiles.Profile,
  getAnimation: (name: FactoryAnimationName) => Profiles.Animation
): void {
  const topFace = DiceUtils.getTopFace(profile.dieType);

  // Connection
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionConnection({
        flags: Profiles.ConnectionFlagsValues.connected,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("connection"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionConnection({
        flags: Profiles.ConnectionFlagsValues.disconnected,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("connection"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );

  // Low Battery
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionBattery({
        flags: Profiles.BatteryFlagsValues.low,
        recheckAfter: 30,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("batteryLow"),
        face: Constants.currentFaceIndex,
        loopCount: 1,
      })
    )
  );

  // Charging
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionBattery({
        flags: Profiles.BatteryFlagsValues.charging,
        recheckAfter: 5,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("batteryCharging"),
        face: topFace,
        loopCount: 1,
      })
    )
  );

  // Fully Charged
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionBattery({
        flags: Profiles.BatteryFlagsValues.done,
        recheckAfter: 5,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("batteryDone"),
        face: topFace,
        loopCount: 1,
      })
    )
  );

  // Bad Charging
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionBattery({
        flags: Profiles.BatteryFlagsValues.badCharging,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("batteryBadCharging"),
        face: topFace,
        loopCount: 1,
      })
    )
  );

  // Charging Error
  profile.rules.push(
    new Profiles.Rule(
      new Profiles.ConditionBattery({
        flags: Profiles.BatteryFlagsValues.error,
        recheckAfter: 1.5,
      }),
      new Profiles.ActionPlayAnimation({
        animation: getAnimation("batteryError"),
        face: topFace,
        loopCount: 1,
      })
    )
  );
}

export function createFactoryProfiles(
  animations: Profiles.Animation[]
): Profiles.Profile[] {
  const profiles: Profiles.Profile[] = [];

  for (let i = 0; i < dieTypesStable.length; ++i) {
    const dieType = dieTypesStable[i];
    const profile = new Profiles.Profile({
      uuid: profilesUuids[i],
      name: "Factory Profile",
      description: "Simple default profile",
      dieType,
    });
    const getAnimation = (name: FactoryAnimationName) => {
      const uuid = getFactoryAnimationUuid(name, dieType);
      const a = animations.find((a) => a.uuid === uuid);
      assert(a, `Missing factory animation ${uuid} of type ${name}`);
      return a;
    };
    addFactoryBaseRules(profile, getAnimation);
    addFactoryAdvancedRules(profile, getAnimation);
    profiles.push(profile);
  }

  return profiles;
}

export function createFactoryAnimations(): Profiles.Animation[] {
  const animations: Profiles.Animation[] = [];

  animations.push(
    new Profiles.AnimationRainbow({
      name: "Rolling Rainbow",
      uuid: helloUuid,
      animFlags:
        Profiles.AnimationFlagsValues.traveling |
        Profiles.AnimationFlagsValues.useLedIndices,
      category: "colorful",
      duration: 2.0,
      faces: Constants.faceMaskAll,
      count: 2,
      fade: 200 / 255,
      intensity: 0x80 / 255,
      cycles: 1,
    })
  );

  animations.push(
    new Profiles.AnimationFlashes({
      name: "Face Colored Blink",
      uuid: rolledUuid,
      category: "uniform",
      count: 1,
      duration: 3,
      color: new Profiles.FaceColor("face"),
      faces: Constants.faceMaskAll,
    })
  );

  animations.push(
    new Profiles.AnimationFlashes({
      name: "Connection",
      uuid: connectedUuid,
      count: 2,
      duration: 1,
      color: Color.blue,
      faces: Constants.faceMaskAll,
    })
  );

  animations.push(
    new Profiles.AnimationFlashes({
      name: "Low Battery",
      uuid: batteryLowUuid,
      count: 3,
      duration: 1.5,
      color: Color.red,
      faces: Constants.faceMaskAll,
    })
  );

  animations.push(
    new Profiles.AnimationFlashes({
      name: "Bad Charging",
      uuid: batteryBadChargingUuid,
      count: 10,
      duration: 2,
      color: Color.red,
      faces: Constants.faceMaskAll,
    })
  );

  for (let i = 0; i < dieTypesStable.length; ++i) {
    const dieType = dieTypesStable[i];
    const topFace = getFaceMask(DiceUtils.getTopFace(dieType), dieType);

    animations.push(
      new Profiles.AnimationFlashes({
        name: "Face Up",
        uuid: rollingUuids[i],
        count: 1,
        duration: 0.1,
        color: new Profiles.FaceColor("face"),
        faces: topFace,
        dieType,
      })
    );

    animations.push(
      new Profiles.AnimationFlashes({
        name: "Charging",
        uuid: batteryChargingUuids[i],
        count: 1,
        duration: 3,
        color: Color.red,
        faces: topFace,
        dieType,
      })
    );

    animations.push(
      new Profiles.AnimationFlashes({
        name: "Finished Charging",
        uuid: batteryDoneUuids[i],
        count: 1,
        duration: 3,
        color: Color.green,
        faces: topFace,
        dieType,
      })
    );

    animations.push(
      new Profiles.AnimationFlashes({
        name: "Charging Error",
        uuid: batteryErrorUuids[i],
        count: 1,
        duration: 1,
        color: Color.yellow,
        faces: topFace,
        dieType,
      })
    );
  }

  return animations;
}

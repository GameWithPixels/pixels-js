import {
  assert,
  bernsteinHash,
  byteSizeOf,
  combineFlags,
  keysToValues,
  safeAssign,
  serialize,
} from "@systemic-games/pixels-core-utils";
import {
  Firmware as FW,
  Pixel,
} from "@systemic-games/react-native-pixels-connect";

// Notes:
// Check byte values >= 0 and <= 255
// Anim Simple => Flash
// Missing scalar type u32
// Add condition rolled
// Rainbow anim duration should be total including count

type Ptr<T> = FW.ObjectPtr<T>;
type Arr<T> = FW.ArrayPtr<T>;

const profileObjects: object[] = [];

function addressOf<T extends object>(obj: T): number {
  const index = profileObjects.indexOf(obj);
  assert(index >= 0, "Object not found in profile");
  return profileObjects
    .slice(0, index)
    .map(byteSizeOf)
    .reduce((a, b) => a + b, 0);
}

function allocate<T extends object>(obj: T): Ptr<T> {
  profileObjects.push(obj);
  return safeAssign(new FW.ObjectPtr<T>(), {
    offset: addressOf(obj),
    obj,
  });
}

function allocateArray<T>(array: T[]): Arr<T> {
  profileObjects.push(array);
  return safeAssign(new FW.ArrayPtr(), {
    length: array.length,
    offset: addressOf(array),
    array,
  });
}

function addGlobal(type: FW.GlobalType): Ptr<FW.DScalarGlobal> {
  return allocate(
    safeAssign(new FW.DScalarGlobal(), {
      globalType: FW.GlobalTypeValues[type],
    })
  );
}

function addRainbow(): Ptr<FW.DGradientRainbow> {
  return allocate(safeAssign(new FW.DGradientRainbow(), {}));
}

function addLookup(
  g: Ptr<FW.DGradient>,
  p: Ptr<FW.DScalar>
): Ptr<FW.DColorLookup> {
  return allocate(
    safeAssign(new FW.DColorLookup(), {
      lookupGradient: g.obj,
      lookupGradientIndex: g.offset,
      parameter: p.obj,
      parameterIndex: p.offset,
    })
  );
}

function addRGB(r: number, g: number, b: number): Ptr<FW.DColorRGB> {
  return allocate(
    safeAssign(new FW.DColorRGB(), {
      rValue: r,
      gValue: g,
      bValue: b,
    })
  );
}

function addAnimRainbow(
  duration: number,
  opt?: {
    count?: number;
    fade?: number;
    intensity?: number;
    faceMask?: number;
  }
): Ptr<FW.AnimationRainbow> {
  return allocate(
    safeAssign(new FW.AnimationRainbow(), {
      animFlags:
        FW.AnimationFlagsValues.traveling |
        FW.AnimationFlagsValues.useLedIndices,
      duration,
      intensity: opt?.intensity ?? 32,
      count: opt?.count ?? 1,
      fade: opt?.fade ?? 128,
      faceMask: opt?.faceMask ?? FW.ANIM_FACEMASK_ALL_LEDS,
    })
  );
}

function addAnimSimple(
  duration: number,
  color: Ptr<FW.DColor>,
  opt?: {
    count?: number;
    fade?: number;
    animFlags?: FW.AnimationFlags[];
    colorFlags?: FW.AnimationSimpleFlags[];
    intensity?: number;
    faceMask?: number;
  }
): Ptr<FW.AnimationSimple> {
  return allocate(
    safeAssign(new FW.AnimationSimple(), {
      animFlags: opt?.animFlags
        ? combineFlags(keysToValues(opt.animFlags, FW.AnimationFlagsValues))
        : 0,
      duration,
      intensity: opt?.intensity ?? 32,
      color: color.obj,
      colorIndex: color.offset,
      count: opt?.count ?? 1,
      colorFlags: opt?.colorFlags
        ? combineFlags(
            keysToValues(opt.colorFlags, FW.AnimationSimpleFlagsValues)
          )
        : 0,
      fade: opt?.fade ?? 128,
      faceMask: opt?.faceMask ?? FW.ANIM_FACEMASK_ALL_LEDS,
    })
  );
}

function createRule(
  condition: Ptr<FW.Condition>,
  actions: Arr<Ptr<FW.Action>>
): FW.Rule {
  return safeAssign(new FW.Rule(), {
    condition: condition.obj,
    conditionOffset: condition.offset,
    actions,
    actionsOffset: actions.offset,
    actionsLength: actions.length,
  });
}

function addCondHello(
  flags?: FW.ConditionHelloGoodbyeFlags[]
): Ptr<FW.ConditionHelloGoodbye> {
  return allocate(
    safeAssign(new FW.ConditionHelloGoodbye(), {
      flags: flags
        ? combineFlags(keysToValues(flags, FW.ConditionHelloGoodbyeFlagsValues))
        : 0,
    })
  );
}

function addCondConn(
  flags?: FW.ConditionConnectionStateFlags[]
): Ptr<FW.ConditionConnectionState> {
  return allocate(
    safeAssign(new FW.ConditionConnectionState(), {
      flags: flags
        ? combineFlags(
            keysToValues(flags, FW.ConditionConnectionStateFlagsValues)
          )
        : 0,
    })
  );
}

function addCondHandling(): Ptr<FW.ConditionHandling> {
  return allocate(safeAssign(new FW.ConditionHandling(), {}));
}

function addCondRolling(repeatPeriod: number): Ptr<FW.ConditionRolling> {
  return allocate(
    safeAssign(new FW.ConditionRolling(), {
      repeatPeriod,
    })
  );
}

function addCondFace(
  flags: FW.ConditionFaceCompareFlags[],
  faceIndex: number
): Ptr<FW.ConditionFaceCompare> {
  return allocate(
    safeAssign(new FW.ConditionFaceCompare(), {
      flags: combineFlags(
        keysToValues(flags, FW.ConditionFaceCompareFlagsValues)
      ),
      faceIndex,
    })
  );
}

function addCondBatt(
  flags: FW.ConditionBatteryStateFlags[],
  repeatPeriod: number
): Ptr<FW.ConditionBatteryState> {
  return allocate(
    safeAssign(new FW.ConditionBatteryState(), {
      flags: combineFlags(
        keysToValues(flags, FW.ConditionBatteryStateFlagsValues)
      ),
      repeatPeriod,
    })
  );
}

function addPlayAnimActionAsArray(
  anim: Ptr<FW.Animation>,
  faceIndex = FW.FACE_INDEX_HIGHEST_FACE
): Arr<Ptr<FW.Action>> {
  const arr = allocateArray([
    allocate<FW.ActionPlayAnimation>(
      safeAssign(new FW.ActionPlayAnimation(), {
        faceIndex,
        animation: anim.obj,
        animOffset: anim.obj ? addressOf(anim.obj) : 0,
      })
    ),
  ]);
  return arr;
}

async function programProfile(pixel: Pixel): Promise<void> {
  profileObjects.length = 0;

  // Create the global that indicates the current face
  const currentFaceScalar = addGlobal("normalizedCurrentFace");
  const rainbowGradient = addRainbow();
  const lookupGradientFromFace = addLookup(rainbowGradient, currentFaceScalar);
  const redColor = addRGB(8, 0, 0);
  const greenColor = addRGB(0, 8, 0);
  const blueColor = addRGB(0, 0, 16);
  const yellowColor = addRGB(6, 6, 0);

  const variablesArray = [
    currentFaceScalar,
    rainbowGradient,
    lookupGradientFromFace,
    redColor,
    greenColor,
    blueColor,
    yellowColor,
  ];

  // Allocate our Hello animation
  const animationRainbow = addAnimRainbow(3000, { count: 3 });
  const animationCharging = addAnimSimple(3000, redColor, {
    fade: 255,
    animFlags: ["highestLed"],
  });
  const animationLowBattery = addAnimSimple(1500, redColor, {
    count: 3,
    fade: 255,
  });
  const animationChargingProblem = addAnimSimple(2000, redColor, {
    count: 10,
    fade: 255,
    animFlags: ["highestLed"],
  });
  const animationFullyCharged = addAnimSimple(10000, greenColor, {
    fade: 32,
    animFlags: ["highestLed"],
  });
  const animationConnection = addAnimSimple(1000, blueColor, {
    fade: 255,
  });
  const animationHandling = addAnimSimple(1000, lookupGradientFromFace, {
    fade: 255,
    animFlags: ["highestLed"],
    colorFlags: ["captureColor"],
  });
  const animationRolling = addAnimSimple(500, lookupGradientFromFace, {
    fade: 255,
    animFlags: ["highestLed"],
    colorFlags: ["captureColor"],
  });
  const animationOnFace = addAnimSimple(3000, lookupGradientFromFace, {
    fade: 255,
    colorFlags: ["captureColor"],
  });
  const animationTempError = addAnimSimple(1000, yellowColor, {
    count: 3,
    fade: 255,
    animFlags: ["highestLed"],
  });

  // Allocate animation array
  const animationsArray = allocateArray<Ptr<FW.Animation>>([
    animationRainbow,
    animationCharging,
    animationLowBattery,
    animationChargingProblem,
    animationFullyCharged,
    animationConnection,
    animationHandling,
    animationRolling,
    animationOnFace,
    animationTempError,
  ]);

  // Allocate rule array
  const rulesArray = allocateArray<FW.Rule>([
    createRule(
      addCondHello(["hello"]),
      addPlayAnimActionAsArray(animationRainbow)
    ),
    createRule(
      addCondHandling(),
      addPlayAnimActionAsArray(animationHandling, FW.FACE_INDEX_CURRENT_FACE)
    ),
    createRule(
      addCondRolling(500),
      addPlayAnimActionAsArray(animationRolling, FW.FACE_INDEX_CURRENT_FACE)
    ),
    createRule(
      addCondFace(["equal", "greater"], 0),
      addPlayAnimActionAsArray(animationOnFace)
    ),
    createRule(
      addCondBatt(["charging"], 5000),
      addPlayAnimActionAsArray(animationCharging)
    ),
    createRule(
      addCondBatt(["badCharging"], 0),
      addPlayAnimActionAsArray(animationChargingProblem)
    ),
    createRule(
      addCondBatt(["low"], 30000),
      addPlayAnimActionAsArray(animationLowBattery)
    ),
    createRule(
      addCondBatt(["done"], 5000),
      addPlayAnimActionAsArray(animationFullyCharged)
    ),
    createRule(
      addCondConn(["connected", "disconnected"]),
      addPlayAnimActionAsArray(animationConnection)
    ),
    createRule(
      addCondBatt(["error"], 1500),
      addPlayAnimActionAsArray(animationTempError)
    ),
  ]);
  assert(animationsArray.array);
  assert(rulesArray.array);

  const variables = variablesArray.map((p) => p.obj!);
  const animations = animationsArray.array.map((p) => p.obj!);
  const rules = rulesArray.array;

  const header = new FW.ProfileHeader();
  const bufferSize =
    variables.map(byteSizeOf).reduce((a, b) => a + b, 0) +
    animations.map(byteSizeOf).reduce((a, b) => a + b, 0) +
    animationsArray.array.map(byteSizeOf).reduce((a, b) => a + b, 0) +
    rules.map(byteSizeOf).reduce((a, b) => a + b, 0) +
    rules
      .map(
        (r) =>
          byteSizeOf(r.condition!) + 2 + byteSizeOf(r.actions!.array![0].obj!)
      )
      .reduce((a, b) => a + b, 0);

  header.bufferSize = bufferSize;
  header.animationsOffset = addressOf(animationsArray.array);
  header.animationsLength = animations.length;
  header.rulesOffset = addressOf(rules);
  header.rulesLength = rules.length;

  let dataView = new DataView(
    new ArrayBuffer(byteSizeOf(header) + bufferSize + 4)
  );
  let byteOffset = 0;
  [dataView, byteOffset] = serialize(header, { dataView, byteOffset });
  // for (const value of variables) {
  //   [dataView, byteOffset] = serialize(value, { dataView, byteOffset });
  // }
  // for (const animation of animations) {
  //   [dataView, byteOffset] = serialize(animation, { dataView, byteOffset });
  // }
  // for (const ptr of animationsArray.array) {
  //   [dataView, byteOffset] = serialize(ptr, { dataView, byteOffset });
  // }
  // for (const rule of rules) {
  //   if (rule.condition) {
  //     [dataView, byteOffset] = serialize(rule.condition, {
  //       dataView,
  //       byteOffset,
  //     });
  //   }
  //   if (rule.actions?.array?.length) {
  //     for (const action of rule.actions.array) {
  //       assert(action.obj, "Action object not found");
  //       [dataView, byteOffset] = serialize(action.obj, {
  //         dataView,
  //         byteOffset,
  //       });
  //     }
  //     for (const action of rule.actions.array) {
  //       [dataView, byteOffset] = serialize(action, {
  //         dataView,
  //         byteOffset,
  //       });
  //     }
  //   }
  // }
  // for (const rule of rules) {
  //   [dataView, byteOffset] = serialize(rule, { dataView, byteOffset });
  // }
  for (const obj of profileObjects) {
    [dataView, byteOffset] = serialize(obj, { dataView, byteOffset });
  }

  assert(byteOffset + 4 === dataView.byteLength, "Buffer size mismatch");

  const hash = bernsteinHash(new Uint8Array(dataView.buffer, 0, byteOffset));
  const footer = safeAssign(new FW.ProfileFooter(), { hash });
  [dataView, byteOffset] = serialize(footer, { dataView, byteOffset });

  // const arr: string[] = [];
  // for (let i = 0; i < dataView.byteLength; i++) {
  //   arr.push(
  //     "0x" + dataView.getUint8(i).toString(16).padStart(2, "0").toUpperCase()
  //   );
  // }
  // console.log(arr.join(", "));

  const notifyProgress = (p: number) => console.log("Transfer: " + p);

  // Upload data
  const data = new Uint8Array(dataView.buffer);
  console.log("Size = " + data.length);
  console.log("Hash = " + hash.toString(16));
  await pixel.applyProfile(data, hash, notifyProgress);
}

export async function testNewAnim(pixel: Pixel): Promise<void> {
  try {
    await programProfile(pixel);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

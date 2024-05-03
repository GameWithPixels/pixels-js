import {
  assert,
  byteSizeOf,
  safeAssign,
  combineFlags,
  keysToValues,
  serialize,
  bernsteinHash,
} from "@systemic-games/pixels-core-utils";

import { Action, ActionPlayAnimation } from "./actions";
import {
  Animation,
  AnimationRainbow,
  AnimationFlagsValues,
  AnimationFlags,
  AnimationSimpleFlags,
  AnimationSimple,
  AnimationSimpleFlagsValues,
} from "./animations";
import { Rule } from "./behaviors";
import {
  ConditionHelloGoodbyeFlags,
  ConditionHelloGoodbyeFlagsValues,
  ConditionConnectionStateFlags,
  ConditionConnectionStateFlagsValues,
  ConditionFaceCompareFlags,
  ConditionFaceCompareFlagsValues,
  ConditionBatteryStateFlags,
  ConditionBatteryStateFlagsValues,
  Condition,
  ConditionHelloGoodbye,
  ConditionConnectionState,
  ConditionHandling,
  ConditionRolling,
  ConditionFaceCompare,
  ConditionBatteryState,
} from "./conditions";
import { ANIM_FACEMASK_ALL_LEDS, FACE_INDEX_HIGHEST_FACE } from "./constants";
import {
  GlobalType,
  DScalarGlobal,
  GlobalTypeValues,
  DGradientRainbow,
  DGradient,
  DScalar,
  DColorLookup,
  DColorRGB,
  DColor,
} from "./parameters";
import { ObjectPtr, ArrayPtr } from "./profileBuffer";
import { ProfileFooter, ProfileHeader } from "./profileData";

type Ptr<T> = ObjectPtr<T>;
type Arr<T> = ArrayPtr<T>;

export class ProfileBuilder {
  readonly _objects: object[] = [];
  readonly _animations: Ptr<Animation>[] = [];
  readonly _rules: Rule[] = [];

  addGlobal(type: GlobalType): Ptr<DScalarGlobal> {
    return this._allocate(
      safeAssign(new DScalarGlobal(), {
        globalType: GlobalTypeValues[type],
      })
    );
  }

  addRainbow(): Ptr<DGradientRainbow> {
    return this._allocate(safeAssign(new DGradientRainbow(), {}));
  }

  addLookup(g: Ptr<DGradient>, p: Ptr<DScalar>): Ptr<DColorLookup> {
    return this._allocate(
      safeAssign(new DColorLookup(), {
        lookupGradient: g.obj,
        lookupGradientIndex: g.offset,
        parameter: p.obj,
        parameterIndex: p.offset,
      })
    );
  }

  addRGB(r: number, g: number, b: number): Ptr<DColorRGB> {
    return this._allocate(
      safeAssign(new DColorRGB(), {
        rValue: r,
        gValue: g,
        bValue: b,
      })
    );
  }

  addAnimRainbow(
    duration: number,
    opt?: {
      count?: number;
      fade?: number;
      intensity?: number;
      faceMask?: number;
    }
  ): Ptr<AnimationRainbow> {
    return this._allocate(
      safeAssign(new AnimationRainbow(), {
        animFlags:
          AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
        duration,
        intensity: opt?.intensity ?? 32,
        count: opt?.count ?? 1,
        fade: opt?.fade ?? 128,
        faceMask: opt?.faceMask ?? ANIM_FACEMASK_ALL_LEDS,
      })
    );
  }

  addAnimSimple(
    duration: number,
    color: Ptr<DColor>,
    opt?: {
      count?: number;
      fade?: number;
      animFlags?: AnimationFlags[];
      colorFlags?: AnimationSimpleFlags[];
      intensity?: number;
      faceMask?: number;
    }
  ): Ptr<AnimationSimple> {
    return this._allocate(
      safeAssign(new AnimationSimple(), {
        animFlags: opt?.animFlags
          ? combineFlags(keysToValues(opt.animFlags, AnimationFlagsValues))
          : 0,
        duration,
        intensity: opt?.intensity ?? 32,
        color: color.obj,
        colorIndex: color.offset,
        count: opt?.count ?? 1,
        colorFlags: opt?.colorFlags
          ? combineFlags(
              keysToValues(opt.colorFlags, AnimationSimpleFlagsValues)
            )
          : 0,
        fade: opt?.fade ?? 128,
        faceMask: opt?.faceMask ?? ANIM_FACEMASK_ALL_LEDS,
      })
    );
  }

  addRule(condition: Ptr<Condition>, actions: Arr<Ptr<Action>>): Rule {
    const rule = safeAssign(new Rule(), {
      condition: condition.obj,
      conditionOffset: condition.offset,
      actions,
      actionsOffset: actions.offset,
      actionsLength: actions.length,
    });
    this._rules.push(rule);
    return rule;
  }

  addCondHello(
    flags?: ConditionHelloGoodbyeFlags[]
  ): Ptr<ConditionHelloGoodbye> {
    return this._allocate(
      safeAssign(new ConditionHelloGoodbye(), {
        flags: flags
          ? combineFlags(keysToValues(flags, ConditionHelloGoodbyeFlagsValues))
          : 0,
      })
    );
  }

  addCondConn(
    flags?: ConditionConnectionStateFlags[]
  ): Ptr<ConditionConnectionState> {
    return this._allocate(
      safeAssign(new ConditionConnectionState(), {
        flags: flags
          ? combineFlags(
              keysToValues(flags, ConditionConnectionStateFlagsValues)
            )
          : 0,
      })
    );
  }

  addCondHandling(): Ptr<ConditionHandling> {
    return this._allocate(safeAssign(new ConditionHandling(), {}));
  }

  addCondRolling(repeatPeriod: number): Ptr<ConditionRolling> {
    return this._allocate(
      safeAssign(new ConditionRolling(), {
        repeatPeriod,
      })
    );
  }

  addCondFace(
    flags: ConditionFaceCompareFlags[],
    faceIndex: number
  ): Ptr<ConditionFaceCompare> {
    return this._allocate(
      safeAssign(new ConditionFaceCompare(), {
        flags: combineFlags(
          keysToValues(flags, ConditionFaceCompareFlagsValues)
        ),
        faceIndex,
      })
    );
  }

  addCondBatt(
    flags: ConditionBatteryStateFlags[],
    repeatPeriod: number
  ): Ptr<ConditionBatteryState> {
    return this._allocate(
      safeAssign(new ConditionBatteryState(), {
        flags: combineFlags(
          keysToValues(flags, ConditionBatteryStateFlagsValues)
        ),
        repeatPeriod,
      })
    );
  }

  addPlayAnimActionAsArray(
    anim: Ptr<Animation>,
    faceIndex = FACE_INDEX_HIGHEST_FACE
  ): Arr<Ptr<Action>> {
    const arr = this._allocateArray([
      this._allocate(
        safeAssign(new ActionPlayAnimation(), {
          faceIndex,
          animation: anim.obj,
          animOffset: anim.obj ? this._addressOf(anim.obj) : 0,
        })
      ),
    ]);
    return arr;
  }

  serialize(): {
    dataView: DataView;
    hash: number;
  } {
    console.log("Animations count = " + this._animations.length);
    this._allocateArray<Ptr<Animation>>(this._animations);
    const animations = this._animations.map((p) => p.obj!);

    console.log("Rules count = " + this._rules.length);
    this._allocateArray<Rule>(this._rules);

    const bufferSize = this._objects.map(byteSizeOf).reduce((a, b) => a + b, 0);
    console.log("bufferSize = " + bufferSize);

    const header = safeAssign(new ProfileHeader(), {
      bufferSize,
      animationsOffset: this._addressOf(this._animations),
      animationsLength: animations.length,
      rulesOffset: this._addressOf(this._rules),
      rulesLength: this._rules.length,
    });

    // Serialize
    let dataView = new DataView(
      new ArrayBuffer(byteSizeOf(header) + bufferSize + 4)
    );
    let byteOffset = 0;
    [dataView, byteOffset] = serialize(header, { dataView, byteOffset });
    for (const obj of this._objects) {
      [dataView, byteOffset] = serialize(obj, { dataView, byteOffset });
    }

    assert(byteOffset + 4 === dataView.byteLength, "Buffer size mismatch");

    // Add hash
    const hash = bernsteinHash(new Uint8Array(dataView.buffer, 0, byteOffset));
    const footer = safeAssign(new ProfileFooter(), { hash });
    [dataView, byteOffset] = serialize(footer, { dataView, byteOffset });

    // const arr: string[] = [];
    // for (let i = 0; i < dataView.byteLength; i++) {
    //   arr.push(
    //     "0x" + dataView.getUint8(i).toString(16).padStart(2, "0").toUpperCase()
    //   );
    // }
    // console.log(arr.join(", "));

    return {
      dataView,
      hash,
    };
  }

  private _addressOf<T extends object>(obj: T): number {
    const index = this._objects.indexOf(obj);
    assert(index >= 0, "Object not found in profile");
    return this._objects
      .slice(0, index)
      .map(byteSizeOf)
      .reduce((a, b) => a + b, 0);
  }

  private _allocate<T extends object>(obj: T): Ptr<T> {
    this._objects.push(obj);
    const ptr = safeAssign(new ObjectPtr<T>(), {
      offset: this._addressOf(obj),
      obj,
    });
    if (obj.constructor.name.startsWith("Animation")) {
      this._animations.push(ptr as Ptr<Animation>);
    }
    return ptr;
  }

  private _allocateArray<T>(array: T[]): Arr<T> {
    this._objects.push(array);
    return safeAssign(new ArrayPtr(), {
      length: array.length,
      offset: this._addressOf(array),
      array,
    });
  }
}

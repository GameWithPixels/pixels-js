import {
  BatteryStateFlags,
  ConnectionStateFlags,
  FaceCompareFlags,
  HelloGoodbyeFlags,
} from "@systemic-games/pixels-core-animation";

import { AnimationSetData } from "./animations";
import { AudioClipData } from "./audioClip";
import { GradientData } from "./gradient";
import { PatternData } from "./pattern";
import { UniqueNamedData } from "./unique";

//
// ProfileSet and Profile
//

export interface ProfilesSetData {
  profiles: ProfileData[];
  animations: AnimationSetData;
  patterns: PatternData[];
  gradients: GradientData[];
  audioClips: AudioClipData[];
}

export interface ProfileData extends UniqueNamedData {
  conditions: {
    helloGoodbye: {
      flags: HelloGoodbyeFlags[];
    }[];
    rolling: {
      recheckAfter: number;
    }[];
    faceCompare: {
      face: number;
      flags: FaceCompareFlags[];
    }[];
    connectionState: {
      flags: ConnectionStateFlags[];
    }[];
    batteryState: {
      flags: BatteryStateFlags[];
      recheckAfter: number;
    }[];
    idle: {
      period: number;
    }[];
    rolled: {
      faces: number[];
    }[];
  };
  actions: {
    playAnimation: {
      animationUuid?: string;
      face: number;
      loopCount: number;
    }[];
    playAudioClip: {
      clipUuid?: string;
    }[];
    makeWebRequest: {
      url: string;
      value: string;
    }[];
  };
  rules: {
    condition: {
      type: keyof ProfileData["conditions"] | "handling" | "crooked";
      index: number;
    };
    actions: {
      type: keyof ProfileData["actions"];
      index: number;
    }[];
  }[];
}

export type ConditionSetData = ProfileData["conditions"];
export type ActionSetData = ProfileData["actions"];
export type RuleData = ProfileData["rules"][number];

//
// Conditions
//

export type ConditionHelloGoodbyeData = NonNullable<
  ConditionSetData["helloGoodbye"]
>[number];
export type ConditionRollingData = NonNullable<
  ConditionSetData["rolling"]
>[number];
export type ConditionFaceCompareData = NonNullable<
  ConditionSetData["faceCompare"]
>[number];
export type ConditionConnectionStateData = NonNullable<
  ConditionSetData["connectionState"]
>[number];
export type ConditionBatteryStateData = NonNullable<
  ConditionSetData["batteryState"]
>[number];
export type ConditionIdleData = NonNullable<ConditionSetData["idle"]>[number];

//
// Actions
//

export type ActionPlayAnimationData = NonNullable<
  ActionSetData["playAnimation"]
>[number];
export type ActionPlayAudioClipData = NonNullable<
  ActionSetData["playAudioClip"]
>[number];

//
// Helpers
//

export function createConditionSetData(): ConditionSetData {
  return {
    helloGoodbye: [],
    rolling: [],
    faceCompare: [],
    connectionState: [],
    batteryState: [],
    idle: [],
    rolled: [],
  };
}

export function createActionSetData(): ActionSetData {
  return {
    playAnimation: [],
    playAudioClip: [],
    makeWebRequest: [],
  };
}

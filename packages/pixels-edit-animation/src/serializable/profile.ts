import {
  BatteryStateFlags,
  ConnectionStateFlags,
  FaceCompareFlags,
  HelloGoodbyeFlags,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import { UniqueNamedData } from "./unique";

export interface ProfileData extends UniqueNamedData {
  description: string;
  dieType: PixelDieType;
  group: string;
  creationDate: number;
  lastChanged: number;
  lastUsed: number;
  conditions: {
    helloGoodbye: {
      flags: HelloGoodbyeFlags[];
    }[];
    rolling: {
      recheckAfter: number;
    }[];
    rolled: {
      face: number;
      flags: FaceCompareFlags[];
    }[];
    connection: {
      flags: ConnectionStateFlags[];
    }[];
    battery: {
      flags: BatteryStateFlags[];
      recheckAfter: number;
    }[];
    idle: {
      period: number;
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
    speakText: {
      text: string;
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
  ConditionSetData["rolled"]
>[number];
export type ConditionConnectionStateData = NonNullable<
  ConditionSetData["connection"]
>[number];
export type ConditionBatteryStateData = NonNullable<
  ConditionSetData["battery"]
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
    rolled: [],
    connection: [],
    battery: [],
    idle: [],
  };
}

export function createActionSetData(): ActionSetData {
  return {
    playAnimation: [],
    playAudioClip: [],
    makeWebRequest: [],
    speakText: [],
  };
}

import {
  BatteryStateFlags,
  ConnectionStateFlags,
  HelloGoodbyeFlags,
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import { UniqueNamedData } from "./unique";
import { WebRequestFormat } from "../edit";

export interface ProfileData extends UniqueNamedData {
  description: string;
  dieType: PixelDieType;
  colorway: PixelColorway;
  brightness: number;
  creationDate: number;
  lastModified: number;
  conditions: {
    helloGoodbye: {
      flags: HelloGoodbyeFlags[];
    }[];
    rolling: {
      recheckAfter: number;
    }[];
    rolled: {
      faces: number[];
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
      duration?: number;
      fade?: number;
      intensity?: number;
      faceMask?: number;
      colors: string[];
    }[];
    playAudioClip: {
      clipUuid?: string;
      volume: number;
      loopCount: number;
    }[];
    makeWebRequest: {
      url: string;
      value: string;
      format: WebRequestFormat;
    }[];
    speakText: {
      text: string;
      volume: number;
      pitch: number;
      rate: number;
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

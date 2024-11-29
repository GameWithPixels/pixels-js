import { createActionSetData, ProfileData } from "./profile";
import { UniqueNamedData } from "./unique";

export interface CompositeProfileData extends UniqueNamedData {
  description: string;
  formula?: string;
  creationDate: number;
  lastModified: number;
  conditions: {
    rolled: ProfileData["conditions"]["rolled"];
    result: {
      value: number;
    }[];
    rollTag: {
      tag: string;
    }[];
  };
  actions: ProfileData["actions"] & {
    playMcpAnimation: {
      animation?: number;
    }[];
  };
  rules: {
    condition: {
      type: keyof CompositeProfileData["conditions"];
      index: number;
    };
    actions: {
      type: keyof CompositeProfileData["actions"];
      index: number;
    }[];
  }[];
}

export type CompositeConditionSetData = CompositeProfileData["conditions"];
export type CompositeActionSetData = CompositeProfileData["actions"];
export type CompositeRuleData = CompositeProfileData["rules"][number];

//
// Conditions
//

export type CompositeConditionResultData = NonNullable<
  CompositeConditionSetData["result"]
>[number];
export type CompositeConditionRollTagData = NonNullable<
  CompositeConditionSetData["rollTag"]
>[number];

//
// Actions
//

export type ActionPlayMcpAnimationData = NonNullable<
  CompositeActionSetData["playMcpAnimation"]
>[number];

//
// Helpers
//

export function createCompositeConditionSetData(): CompositeConditionSetData {
  return {
    rolled: [],
    result: [],
    rollTag: [],
  };
}

export function createCompositeActionSetData(): CompositeActionSetData {
  return {
    ...createActionSetData(),
    playMcpAnimation: [],
  };
}

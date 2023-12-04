import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Profile Condition
 * @enum
 */
export const ConditionTypeValues = {
  none: enumValue(0),
  helloGoodbye: enumValue(),
  handling: enumValue(),
  rolling: enumValue(),
  rolled: enumValue(),
  crooked: enumValue(),
  bluetoothEvent: enumValue(),
  batteryEvent: enumValue(),
  idle: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ConditionTypeValues}.
 * @category Profile Condition
 */
export type ConditionType = keyof typeof ConditionTypeValues;

/**
 * Defines the supported types of actions.
 * @category Profile Action
 * @enum
 */
export const ActionTypeValues = {
  none: enumValue(0),
  playAnimation: enumValue(),
  //runOnDevice: enumValue(),
  playSound: enumValue(),
  textToSpeech: enumValue(),
  webRequest: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ActionTypeValues}.
 * @category Profile Action
 */
export type ActionType = keyof typeof ActionTypeValues;

export class Condition {
  readonly type: ConditionType;

  constructor(type: ConditionType) {
    this.type = type;
  }
}

export /*abstract*/ class Action {
  readonly type: ActionType;

  constructor(type: ActionType) {
    this.type = type;
  }
}

export class Rule {
  condition: Condition;

  actions: Action[];

  constructor(condition: Condition, opt?: { actions?: Action[] }) {
    this.condition = condition;
    this.actions = opt?.actions ?? [];
  }
}

export class ColorDesign {
  readonly uuid: string;

  readonly name: string;

  constructor(opt?: { uuid?: string; name?: string }) {
    this.uuid = opt?.uuid ?? Math.random().toString();
    this.name = opt?.name ?? "";
  }
}
export class PixelProfile {
  private _uuid: string;

  name: string;

  description: string;

  group: string;

  favorite: boolean;

  rules: Rule[];

  get uuid() {
    return this._uuid;
  }

  constructor(opt?: {
    uuid?: string;
    name?: string;
    description?: string;
    group?: string;
    favorite?: boolean;
    rules?: Rule[];
  }) {
    this._uuid = opt?.uuid ?? Math.random().toString();
    this.name = opt?.name ?? "";
    this.description = opt?.description ?? "";
    this.group = opt?.group ?? "";
    this.favorite = opt?.favorite ?? false;
    this.rules = opt?.rules ?? [];
  }
}

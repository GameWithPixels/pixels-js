import {
  ActionType,
  DataSet,
  Profile,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRule from "./EditRule";
import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditProfile extends Editable {
  @observable
  favorite: boolean; // TODO temp

  @observable
  group: string; // TODO temp

  @observable
  description: string;

  @observable
  rules: EditRule[];

  constructor(opt?: {
    uuid?: string;
    name?: string;
    description?: string;
    rules?: EditRule[];
    group?: string;
    favorite?: boolean;
  }) {
    super(opt);
    this.description = opt?.description ?? "";
    this.rules = opt?.rules ?? [];
    this.group = opt?.group ?? "";
    this.favorite = opt?.favorite ?? false;
  }

  getRemoteAction(actionId: number): EditActionRunOnDevice | undefined {
    const ruleId = actionId >> 8;
    const action = this.rules[ruleId]?.actions[actionId & 0xff];
    return action instanceof EditActionRunOnDevice
      ? (action as EditActionRunOnDevice)
      : undefined;
  }

  toProfile(editSet: EditDataSet, set: DataSet): Profile {
    // Add our rules to the set
    const rulesOffset = set.rules.length;
    this.rules.forEach((editRule, i) =>
      set.rules.push(editRule.toRule(editSet, set, i))
    );

    const rulesCount = this.rules.length;
    return safeAssign(new Profile(), {
      rulesOffset,
      rulesCount,
    });
  }

  duplicate(uuid?: string): EditProfile {
    return new EditProfile({
      ...this,
      uuid,
      rules: this.rules.map((r) => r.duplicate()),
    });
  }

  collectAnimations(): EditAnimation[] {
    const animations: EditAnimation[] = [];
    for (const r of this.rules) {
      for (const action of r.actions) {
        for (const anim of action.collectAnimations()) {
          if (!animations.includes(anim)) {
            animations.push(anim);
          }
        }
      }
    }
    return animations;
  }

  hasActionOfType(type: ActionType): boolean {
    return !this.rules.every((r) => !r.actions.every((a) => a.type !== type));
  }
}

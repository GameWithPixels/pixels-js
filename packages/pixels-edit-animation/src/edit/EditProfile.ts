import { DataSet, Profile } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRule from "./EditRule";
import Editable from "./Editable";

export default class EditProfile extends Editable {
  description: string;
  rules: EditRule[];

  constructor(opt?: {
    uuid?: string;
    name?: string;
    description?: string;
    rules?: EditRule[];
  }) {
    super(opt);
    this.description = opt?.description ?? "";
    this.rules = opt?.rules ?? [];
  }

  getRemoteAction(actionId: number): EditActionRunOnDevice | null {
    const ruleId = actionId >> 8;
    const action = this.rules[ruleId]?.actions[actionId & 0xff];
    return action instanceof EditActionRunOnDevice
      ? (action as EditActionRunOnDevice)
      : null;
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
    return new EditProfile({ ...this, uuid });
  }

  collectAnimations(): EditAnimation[] {
    const animations: EditAnimation[] = [];
    this.rules.forEach((r) => {
      r.actions.forEach((action) => {
        action.collectAnimations().forEach((anim) => {
          if (!animations.includes(anim)) {
            animations.push(anim);
          }
        });
      });
    });
    return animations;
  }
}

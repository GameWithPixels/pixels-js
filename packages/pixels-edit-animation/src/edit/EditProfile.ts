import { DataSet, Profile } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRule from "./EditRule";
import Editable from "./Editable";

export default class EditProfile extends Editable {
  name: string;
  description: string;
  rules: EditRule[];

  constructor(name = "Profile", description = "", rules: EditRule[] = []) {
    super();
    this.name = name;
    this.description = description;
    this.rules = rules;
  }

  toProfile(editSet: EditDataSet, set: DataSet): Profile {
    // Add our rules to the set
    const rulesOffset = set.rules.length;
    this.rules.forEach((editRule) =>
      set.rules.push(editRule.toRule(editSet, set))
    );

    const rulesCount = this.rules.length;
    return safeAssign(new Profile(), {
      rulesOffset,
      rulesCount,
    });
  }

  duplicate(): EditProfile {
    return new EditProfile(
      this.name,
      this.description,
      this.rules.map((r) => r.duplicate())
    );
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

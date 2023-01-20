import { DataSet, Rule } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditAnimation from "./EditAnimation";
import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import Editable from "./Editable";

export default class EditRule extends Editable {
  condition: EditCondition;
  readonly actions: EditAction[];

  constructor(condition: EditCondition, actions: EditAction[] = []) {
    super();
    this.condition = condition;
    this.actions = actions;
  }

  toRule(editSet: EditDataSet, set: DataSet): Rule {
    // Create our condition
    const conditionIndex = set.conditions.length;
    if (this.condition) {
      set.conditions.push(this.condition.toCondition(editSet, set));
    }

    // Create our action
    const actionOffset = set.actions.length;
    this.actions.forEach((editAction) => {
      const act = editAction.toAction(editSet, set);
      set.actions.push(act);
    });

    return safeAssign(new Rule(), {
      condition: conditionIndex,
      actionOffset,
      actionCount: this.actions.length,
    });
  }

  duplicate(): EditRule {
    return new EditRule(
      this.condition?.duplicate(),
      this.actions.map((action) => action.duplicate())
    );
  }

  replaceAnimation(
    oldAnimation: EditAnimation,
    newAnimation: EditAnimation
  ): void {
    this.actions.forEach((action) => {
      action.replaceAnimation(oldAnimation, newAnimation);
    });
  }

  requiresAnimation(animation: EditAnimation): boolean {
    return !!this.actions.find((a) => a.requiresAnimation(animation));
  }
}

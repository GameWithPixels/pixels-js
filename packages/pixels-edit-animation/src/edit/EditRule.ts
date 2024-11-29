import { DataSet, Rule } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionPlayAnimation from "./EditActionPlayAnimation";
import EditAnimation from "./EditAnimation";
import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditRule {
  readonly uuid: string;

  @observable
  condition: EditCondition;

  @observable
  actions: EditAction[];

  constructor(condition: EditCondition, actions?: EditAction[] | EditAction) {
    this.uuid = Math.random().toString(); // TODO until we have real UUIDs for rules
    this.condition = condition;
    this.actions = !actions ? [] : Array.isArray(actions) ? actions : [actions];
  }

  toRule(editSet: EditDataSet, set: DataSet, ruleId: number): Rule {
    // Create our condition
    const conditionIndex = set.conditions.length;
    if (this.condition) {
      set.conditions.push(this.condition.toCondition(editSet, set));
    }

    // Create our action
    const actionOffset = set.actions.length;
    let actionId = ruleId << 8;
    for (const editAction of this.actions) {
      const act = editAction.toAction(editSet, set, actionId);
      ++actionId;
      set.actions.push(act);
    }

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
    for (const action of this.actions) {
      if (action instanceof EditActionPlayAnimation) {
        action.replaceAnimation(oldAnimation, newAnimation);
      }
    }
  }

  requiresAnimation(animation: EditAnimation): boolean {
    return !!this.actions.find(
      (a) =>
        a instanceof EditActionPlayAnimation && a.requiresAnimation(animation)
    );
  }
}

import EditAction from "./EditAction";
import EditCompositeAction from "./EditCompositeAction";
import EditCompositeCondition from "./EditCompositeCondition";
import EditConditionRolled from "./EditConditionRolled";
import { observable } from "./decorators";

export default class EditCompositeRule {
  readonly uuid: string;

  @observable
  condition: EditCompositeCondition | EditConditionRolled;

  @observable
  actions: (EditCompositeAction | EditAction)[]; // All actions can be used in a composite rule

  constructor(
    condition: EditCompositeRule["condition"],
    actions?: EditCompositeRule["actions"]
  ) {
    this.uuid = Math.random().toString(); // TODO until we have real UUIDs for rules
    this.condition = condition;
    this.actions = !actions ? [] : Array.isArray(actions) ? actions : [actions];
  }

  duplicate(): EditCompositeRule {
    return new EditCompositeRule(
      this.condition?.duplicate() as EditCompositeRule["condition"],
      this.actions.map((action) => action.duplicate())
    );
  }
}

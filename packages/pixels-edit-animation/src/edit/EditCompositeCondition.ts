import { CompositeConditionType } from "./CompositeConditionType";

export default abstract class EditCompositeCondition {
  abstract readonly type: CompositeConditionType;

  abstract duplicate(): EditCompositeCondition;
}

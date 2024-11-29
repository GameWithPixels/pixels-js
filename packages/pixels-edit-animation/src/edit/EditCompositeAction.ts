import { CompositeActionType } from "./CompositeActionType";

export default abstract class EditCompositeAction {
  abstract readonly type: CompositeActionType;

  abstract duplicate(): EditCompositeAction;
}

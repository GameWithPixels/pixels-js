import {
  DataSet,
  ActionType,
  Action,
} from "@systemic-games/pixels-core-animation";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";

export default abstract class EditAction {
  abstract get type(): ActionType;
  abstract toAction(
    editSet: EditDataSet,
    set: DataSet,
    actionId: number
  ): Action;
  abstract duplicate(): EditAction;

  replaceAnimation(
    _oldAnimation: EditAnimation,
    _newAnimation: EditAnimation
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  requiresAnimation(_animation: EditAnimation): boolean {
    return false;
  }

  collectAnimations(): EditAnimation[] {
    return [];
  }
}

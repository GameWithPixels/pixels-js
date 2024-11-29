import {
  DataSet,
  ActionType,
  Action,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";

export default abstract class EditAction {
  abstract readonly type: ActionType;

  abstract toAction(
    editSet: EditDataSet,
    set: DataSet,
    actionId: number
  ): Action;

  abstract duplicate(): EditAction;
}

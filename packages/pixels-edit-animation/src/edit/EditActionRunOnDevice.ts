import { RemoteActionType } from "@systemic-games/pixels-core-animation";

import EditAction from "./EditAction";

export default abstract class EditActionRunOnDevice extends EditAction {
  abstract readonly remoteType: RemoteActionType;
}

import { ActionType } from "./ActionType";

/// <summary>
/// Base interface for Actions. Stores the actual type so that we can cast the data
/// to the proper derived type and access the parameters.
/// </summary>
export default interface Action {
  type: ActionType;
}

import { ActionType } from "./ActionType";

/**
 * Base interface for Actions.
 * Stores the actual type so that we can cast the data
 * to the proper derived type and access the parameters.
 * @category Profile Action
 */
export default interface Action {
  type: ActionType;
}

import { serializable } from "@systemic-games/pixels-core-utils";

import { ArrayPtr, ObjectPtr } from "./profileBuffer";
import { Condition, Action } from "../profiles";

/**
 * A behavior is made of rules, and this is what a rule is:
 * a pairing of a condition and an actions. We are using indices and not pointers
 * because this stuff is stored in flash and so we don't really know what the pointers are.
 */
export class Rule {
  condition?: Condition;
  @serializable(2)
  conditionOffset = 0;

  actions?: ArrayPtr<ObjectPtr<Action>>;
  @serializable(2)
  actionsOffset = 0;
  @serializable(1)
  actionsLength = 0;
}

/**
 * A behavior is a set of condition->animation pairs, that's it!
 */
export class Behavior {
  rules?: Rule[];
  @serializable(2)
  rulesOffset = 0;
  @serializable(1)
  rulesLength = 0;
}

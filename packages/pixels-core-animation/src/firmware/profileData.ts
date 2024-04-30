import { serializable } from "@systemic-games/pixels-core-utils";

import { Animation } from "./animations";
import { Rule } from "./behaviors";
import { PROFILE_VERSION } from "./constants";

export class ProfileData {
  @serializable(4)
  version = PROFILE_VERSION;

  @serializable(4)
  hash = 0;

  @serializable(2)
  dataSize = 0; // Animations + rules

  // The animations. Because animations can be one of multiple classes (simple inheritance system)
  // The dataset stores an offset into the animations buffer for each entry. The first member of
  // The animation base class is a type enum indicating what it actually is.
  // The buffer is after these members
  animations?: Animation[];
  @serializable(2)
  animationsOffset = 0;
  @serializable(1)
  animationsLength = 0;

  // Rules are pairs or conditions and actions
  rules?: Rule[];
  @serializable(2)
  rulesOffset = 0;
  @serializable(1)
  rulesLength = 0;
}

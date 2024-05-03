import { serializable } from "@systemic-games/pixels-core-utils";

import { Animation } from "./animations";
import { Rule } from "./behaviors";
import { PROFILE_VALID_KEY, PROFILE_VERSION } from "./constants";

export class ProfileHeader {
  @serializable(4)
  headerStartMarker = PROFILE_VALID_KEY;

  @serializable(4)
  version = PROFILE_VERSION;

  @serializable(2)
  bufferSize = 0; // Animations + rules

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

  @serializable(4)
  headerEndMarker = PROFILE_VALID_KEY;
}

export class ProfileFooter {
  @serializable(4)
  hash = 0;
}

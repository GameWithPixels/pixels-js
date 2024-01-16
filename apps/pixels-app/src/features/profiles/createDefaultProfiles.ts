import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { createProfileTemplates } from "./createProfileTemplates";
import { addFactoryAdvancedRules } from "../store/library/factory";
import { readAnimation } from "../store/profiles";
import { generateUuid } from "../utils";

import { LibraryState } from "~/app/store";

export function createDefaultProfiles(
  dieType: PixelDieType,
  library: LibraryState
): Profiles.Profile[] {
  return createProfileTemplates(dieType, library).map((p) =>
    addFactoryAdvancedRules(p.duplicate(generateUuid()), (uuid) =>
      readAnimation(uuid, library)
    )
  );
}

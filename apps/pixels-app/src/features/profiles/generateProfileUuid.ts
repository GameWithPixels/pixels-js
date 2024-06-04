import { generateUuid } from "../utils";

import { LibraryState } from "~/app/store";

export function generateProfileUuid(library: LibraryState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (library.profiles.ids.includes(uuid));
  return uuid;
}

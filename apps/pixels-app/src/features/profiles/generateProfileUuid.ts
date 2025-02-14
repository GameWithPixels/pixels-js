import { generateUuid } from "../utils";

import { LibraryState } from "~/app/store";

export function generateProfileUuid({
  profiles: { ids },
}: LibraryState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (ids.includes(uuid));
  return uuid;
}

import { AppActionsState } from "~/features/store";
import { generateUuid } from "~/features/utils";

export function generateAppActionUuid({ entries }: AppActionsState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (entries.entities[uuid]);
  return uuid;
}

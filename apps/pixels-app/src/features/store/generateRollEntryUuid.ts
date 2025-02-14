import { DiceRollerState } from "~/app/store";
import { generateUuid } from "~/features/utils";

export function generateRollEntryUuid({
  singleRolls,
  formulaRolls,
}: DiceRollerState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (singleRolls.entities[uuid] || formulaRolls.entities[uuid]);
  return uuid;
}

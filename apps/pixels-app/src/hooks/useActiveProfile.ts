import { assert, unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";

export function usePairedDieProfileUuid(
  pairedDie: Pick<PairedDie, "pixelId" | "dieType">
): string {
  const profileUuid = useAppSelector(
    (state) =>
      state.pairedDice.paired.find((d) => d.die.pixelId === pairedDie.pixelId)
        ?.die.profileUuid
  );
  assert(
    profileUuid?.length,
    `No active profile found for pixel ${unsigned32ToHex(pairedDie.pixelId)}`
  );
  // logError(`No active profile found for pixel ${unsigned32ToHex(pixel.pixelId)}`);
  return profileUuid;
}

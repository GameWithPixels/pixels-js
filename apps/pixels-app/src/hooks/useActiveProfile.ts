import { assert, unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";

export function usePairedDieProfileUuid(
  pairedDie: Pick<PairedDie, "pixelId" | "dieType">
): string {
  const profileUuid = useAppSelector(
    (state) =>
      pairedDiceSelectors.selectByPixelId(state, pairedDie.pixelId)?.profileUuid
  );
  assert(
    profileUuid?.length,
    `No profile found for pixel ${unsigned32ToHex(pairedDie.pixelId)}`
  );
  // logError(`No profile found for pixel ${unsigned32ToHex(pixel.pixelId)}`);
  return profileUuid;
}

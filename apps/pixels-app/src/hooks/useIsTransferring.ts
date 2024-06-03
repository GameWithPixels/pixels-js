import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PairedDie } from "~/app/PairedDie";
import { PixelSchedulerEventMap } from "~/features/dice";

export function useIsTransferring({
  pixelId,
}: Pick<PairedDie, "pixelId">): boolean {
  const central = usePixelsCentral();
  const [transferring, setIsTransferring] = React.useState(
    central.getScheduler(pixelId).currentOperation?.type === "programProfile"
  );
  React.useEffect(() => {
    const onOperation = (op: PixelSchedulerEventMap["onOperation"]) => {
      const { type: opType } = op.operation;
      const { type: evType } = op.event;
      switch (evType) {
        case "queued":
          break;
        case "processing":
          setIsTransferring(opType === "programProfile");
          break;
        case "succeeded":
        case "failed":
          setIsTransferring(false);
          break;
        default:
          assertNever(evType);
      }
    };
    const scheduler = central.getScheduler(pixelId);
    scheduler.addEventListener("onOperation", onOperation);
    return scheduler.removeEventListener("onOperation", onOperation);
  }, [central, pixelId]);
  return transferring;
}

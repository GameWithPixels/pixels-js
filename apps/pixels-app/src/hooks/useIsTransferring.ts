import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

import { PairedDie } from "~/app/PairedDie";

export function useIsTransferring({
  pixelId,
}: Pick<PairedDie, "pixelId">): boolean {
  const central = usePixelsCentral();
  const [transferring, setIsTransferring] = React.useState(
    central.getCurrentOperation(pixelId)?.type === "programProfile"
  );
  React.useEffect(() => {
    setIsTransferring(
      central.getCurrentOperation(pixelId)?.type === "programProfile"
    );
    return central.addSchedulerListener(pixelId, "onOperationStatus", (op) => {
      const { type: opType } = op.operation;
      const status = op.status;
      switch (status) {
        case "queued":
          break;
        case "starting":
          setIsTransferring(opType === "programProfile");
          break;
        case "succeeded":
        case "failed":
        case "dropped":
          setIsTransferring(false);
          break;
        default:
          assertNever(status);
      }
    });
  }, [central, pixelId]);
  return transferring;
}

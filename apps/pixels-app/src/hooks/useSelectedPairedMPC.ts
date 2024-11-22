import React from "react";

import { PairedMPC } from "~/app/PairedMPC";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { setSelectedDieId } from "~/features/store";

export function useSelectedPairedMPC(): PairedMPC | undefined {
  const pixelId = useAppSelector(
    (state) => state.appTransient.demo.selectedMPCId
  );
  return useAppSelector((state) =>
    pixelId
      ? state.pairedMPCs.paired.find((d) => d.pixelId === pixelId)
      : undefined
  );
}

export function useSetSelectedPairedMPC(
  pixelId: number
): PairedMPC | undefined {
  const appDispatch = useAppDispatch();
  React.useEffect(() => {
    appDispatch(setSelectedDieId(pixelId));
  }, [appDispatch, pixelId]);
  return useAppSelector((state) =>
    pixelId
      ? state.pairedMPCs.paired.find((d) => d.pixelId === pixelId)
      : undefined
  );
}

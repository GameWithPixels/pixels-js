import React from "react";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";
import { setSelectedDieId } from "~/features/store";

export function useSelectedPairedDie(): PairedDie | undefined {
  const pixelId = useAppSelector(
    (state) => state.appTransient.dice.selectedDieId
  );
  return useAppSelector((state) =>
    pixelId ? pairedDiceSelectors.selectByPixelId(state, pixelId) : undefined
  );
}

export function useSetSelectedPairedDie(
  pixelId: number
): PairedDie | undefined {
  const appDispatch = useAppDispatch();
  React.useEffect(() => {
    appDispatch(setSelectedDieId(pixelId));
  }, [appDispatch, pixelId]);
  return useAppSelector((state) =>
    pixelId ? pairedDiceSelectors.selectByPixelId(state, pixelId) : undefined
  );
}

import React from "react";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";

export interface SelectedPairedDieState {
  pairedDieId?: number;
  setPairedDieId: (pairedDieId?: number) => void;
}

export const SelectedPairedDieContext =
  React.createContext<SelectedPairedDieState>({
    setPairedDieId: () => {},
  });

export function useSelectedPairedDie(): PairedDie | undefined {
  const pixelId = React.useContext(SelectedPairedDieContext).pairedDieId;
  return useAppSelector((state) =>
    pixelId ? pairedDiceSelectors.selectByPixelId(state, pixelId) : undefined
  );
}

export function useSetSelectedPairedDie(
  pixelId: number
): PairedDie | undefined {
  const { setPairedDieId } = React.useContext(SelectedPairedDieContext);
  React.useEffect(() => setPairedDieId(pixelId), [pixelId, setPairedDieId]);
  return useAppSelector((state) =>
    pixelId ? pairedDiceSelectors.selectByPixelId(state, pixelId) : undefined
  );
}

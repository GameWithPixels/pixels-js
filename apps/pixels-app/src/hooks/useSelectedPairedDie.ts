import React from "react";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";

export interface SelectedPairedDieState {
  pairedDie?: PairedDie;
  setPairedDie: (pairedDie?: PairedDie) => void;
}

export const SelectedPairedDieContext =
  React.createContext<SelectedPairedDieState>({
    setPairedDie: () => {},
  });

export function useSelectedPairedDie(): PairedDie | undefined {
  return React.useContext(SelectedPairedDieContext).pairedDie;
}

export function useSetSelectedPairedDie(
  pixelId: number
): PairedDie | undefined {
  const pairedDie = useAppSelector((state) =>
    pairedDiceSelectors.selectByPixelId(state, pixelId)
  );
  const { setPairedDie } = React.useContext(SelectedPairedDieContext);
  React.useEffect(() => setPairedDie(pairedDie), [pairedDie, setPairedDie]);
  return pairedDie;
}

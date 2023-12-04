import React from "react";

export interface SettingsContextData {
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  showPromo: boolean;
  setShowPromo: (show: boolean) => void;
}

export const SettingsContext = React.createContext<SettingsContextData>({
  showIntro: false,
  setShowIntro: () => {},
  showPromo: false,
  setShowPromo: () => {},
});

export function useSettings(): SettingsContextData {
  return { ...React.useContext(SettingsContext) };
}

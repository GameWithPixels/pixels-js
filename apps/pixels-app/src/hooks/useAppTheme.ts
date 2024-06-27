import React from "react";

import { RootScreenName } from "~/navigation";
import { AppDarkTheme, AppTheme, AppThemes } from "~/themes";

export const AppThemesContext = React.createContext<{
  themes: AppThemes;
  setThemes: (setter: (themes: AppThemes) => AppThemes) => void;
}>({
  themes: {
    onboarding: AppDarkTheme,
    home: AppDarkTheme,
    profiles: AppDarkTheme,
    animations: AppDarkTheme,
    settings: AppDarkTheme,
  } as { [key in RootScreenName]: AppTheme },
  setThemes: () => {},
});

export function useAppTheme(screenName: RootScreenName): AppTheme {
  return React.useContext(AppThemesContext)["themes"][screenName];
}

export function useSetAppTheme(): (
  key: keyof AppThemes,
  theme: AppTheme
) => void {
  const { setThemes } = React.useContext(AppThemesContext);
  return React.useCallback(
    (key: RootScreenName, theme: AppTheme) => {
      setThemes((prev) => ({ ...prev, [key]: theme }));
    },
    [setThemes]
  );
}

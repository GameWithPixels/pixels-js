import { useAppSelector } from "~/app/hooks";
import { RootScreenName } from "~/app/navigation";
import { AppTheme, AppThemes } from "~/app/themes";

export function useAppTheme(screenName: RootScreenName): AppTheme {
  return (
    AppThemes[
      useAppSelector((state) => state.appSettings.screensTheme[screenName])
    ] ?? AppThemes.dark
  );
}

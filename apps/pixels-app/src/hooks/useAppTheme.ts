import { useAppSelector } from "~/app/hooks";
import { RootScreenName } from "~/navigation";
import { AppTheme, AppThemes } from "~/themes";

export function useAppTheme(screenName: RootScreenName): AppTheme {
  return (
    AppThemes[
      useAppSelector((state) => state.appSettings.screensTheme[screenName])
    ] ?? AppThemes.dark
  );
}

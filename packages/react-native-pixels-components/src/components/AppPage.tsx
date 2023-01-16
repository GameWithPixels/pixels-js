import {
  BaseAppPage,
  AppPageProps,
} from "@systemic-games/react-native-base-components";

export function AppPage(props: AppPageProps) {
  return (
    <BaseAppPage {...props} theme={props.theme} lightBg="pixelColors.softBlack">
      {props.children}
    </BaseAppPage>
  );
}

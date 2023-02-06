import {
  AppPage,
  AppPageProps,
} from "@systemic-games/react-native-base-components";

export function PixelAppPage(props: AppPageProps) {
  return <AppPage {...props} bg={props.bg ?? "pixelColors.softBlack"} />;
}

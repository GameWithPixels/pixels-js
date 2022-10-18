import { theme as BaseTheme } from "@systemic-games/react-native-base-components";
import { extendTheme } from "native-base";

import components from "./components";

export const Pxtheme = extendTheme(BaseTheme, {
  // @ts-expect-error : conflict between themes merging (type difference)
  components,
});

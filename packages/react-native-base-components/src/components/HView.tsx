import { View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";

/**
 * Shortcut to a Native Base view with flex direction set to row.
 */
export function HView(props: IViewProps) {
  return <View flexDir="row" {...props} />;
}

import { PropsWithChildren } from "react";
import { View as RnView } from "react-native";

import { RoundedFlexProps, useRoundedStyle } from "../useRoundedStyle";

export interface RoundedBoxProps extends PropsWithChildren<RoundedFlexProps> {}

export function RoundedBox({ children, ...props }: RoundedBoxProps) {
  return <RnView style={useRoundedStyle(props)} children={children} />;
}

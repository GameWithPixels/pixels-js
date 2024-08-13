import React, { PropsWithChildren } from "react";
import { View as RnView } from "react-native";

import {
  BaseFlexProps,
  expandShorthandStyle,
} from "~/features/expandShorthandStyle";

export interface BaseBoxProps extends PropsWithChildren<BaseFlexProps> {}

export function BaseBox({ children, ...props }: BaseBoxProps) {
  return <RnView style={expandShorthandStyle(props)} children={children} />;
}

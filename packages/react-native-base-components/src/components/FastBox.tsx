import React, { PropsWithChildren } from "react";
import { View as RnView, ViewStyle } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

export interface FastFlexProps
  extends Pick<
    ViewStyle,
    | "flex"
    | "flexDirection"
    | "flexGrow"
    | "flexShrink"
    | "flexWrap"
    | "gap"
    | "rowGap"
    | "columnGap"
    | "position"
    | "alignSelf"
    | "alignItems"
    | "alignContent"
    | "justifyContent"
    | "left"
    | "right"
    | "width"
    | "minWidth"
    | "maxWidth"
    | "top"
    | "bottom"
    | "height"
    | "minHeight"
    | "maxHeight"
    | "aspectRatio"
    | "padding"
    | "paddingHorizontal"
    | "paddingVertical"
    | "paddingTop"
    | "paddingBottom"
    | "paddingLeft"
    | "paddingRight"
    | "margin"
    | "marginHorizontal"
    | "marginVertical"
    | "marginTop"
    | "marginBottom"
    | "marginLeft"
    | "marginRight"
    | "borderRadius"
    | "borderStyle"
    | "borderWidth"
    | "borderColor"
    | "opacity"
    | "backgroundColor"
  > {
  flexDir?: ViewStyle["flexDirection"];
  w?: ViewStyle["width"];
  h?: ViewStyle["height"];
  p?: ViewStyle["padding"];
  px?: ViewStyle["paddingHorizontal"];
  py?: ViewStyle["paddingVertical"];
  pt?: ViewStyle["paddingTop"];
  pb?: ViewStyle["paddingBottom"];
  pl?: ViewStyle["paddingLeft"];
  pr?: ViewStyle["paddingRight"];
  m?: ViewStyle["margin"];
  mx?: ViewStyle["marginHorizontal"];
  my?: ViewStyle["marginVertical"];
  mt?: ViewStyle["marginTop"];
  mb?: ViewStyle["marginBottom"];
  ml?: ViewStyle["marginLeft"];
  mr?: ViewStyle["marginRight"];
  bg?: ViewStyle["backgroundColor"];
}

export function expandShorthandStyle(props: FastFlexProps): ViewStyle {
  const p = props;
  if (Object.hasOwn(props, "flexDir")) {
    p.flexDirection = props.flexDir;
  }
  if (Object.hasOwn(props, "w")) {
    p.width = props.w;
  }
  if (Object.hasOwn(props, "h")) {
    p.height = props.h;
  }
  if (Object.hasOwn(props, "p")) {
    p.padding = props.p;
  }
  if (Object.hasOwn(props, "px")) {
    p.paddingHorizontal = props.px;
  }
  if (Object.hasOwn(props, "py")) {
    p.paddingVertical = props.py;
  }
  if (Object.hasOwn(props, "pt")) {
    p.paddingTop = props.pt;
  }
  if (Object.hasOwn(props, "pb")) {
    p.paddingBottom = props.pb;
  }
  if (Object.hasOwn(props, "pl")) {
    p.paddingLeft = props.pl;
  }
  if (Object.hasOwn(props, "pr")) {
    p.paddingRight = props.pr;
  }
  if (Object.hasOwn(props, "m")) {
    p.margin = props.m;
  }
  if (Object.hasOwn(props, "mx")) {
    p.marginHorizontal = props.mx;
  }
  if (Object.hasOwn(props, "my")) {
    p.marginVertical = props.my;
  }
  if (Object.hasOwn(props, "mt")) {
    p.marginTop = props.mt;
  }
  if (Object.hasOwn(props, "mb")) {
    p.marginBottom = props.mb;
  }
  if (Object.hasOwn(props, "ml")) {
    p.marginLeft = props.ml;
  }
  if (Object.hasOwn(props, "mt")) {
    p.marginRight = props.mr;
  }
  if (Object.hasOwn(props, "bg")) {
    p.backgroundColor = props.bg;
  }
  return p;
}

export interface FastBoxProps extends PropsWithChildren<FastFlexProps> {}

export function FastBox({ children, ...props }: FastBoxProps) {
  return <RnView style={expandShorthandStyle(props)} children={children} />;
}

export interface RoundedFlexProps extends FastFlexProps {
  fill?: boolean;
  fillThemeColor?: keyof Omit<MD3Theme["colors"], "elevation">;
  border?: boolean;
  borderThemeColor?: keyof Omit<MD3Theme["colors"], "elevation">;
}

export interface RoundedBoxProps extends PropsWithChildren<RoundedFlexProps> {}

export function useRoundedStyle({
  fill,
  fillThemeColor = "primaryContainer",
  border,
  borderThemeColor = "primary",
  ...props
}: RoundedFlexProps) {
  const theme = useTheme();
  const style = expandShorthandStyle(props);
  if (fill && !Object.hasOwn(style, "backgroundColor")) {
    style.backgroundColor = theme.colors[fillThemeColor];
  }
  const borderRadius = (theme.isV3 ? 5 : 1) * theme.roundness;
  if (!Object.hasOwn(style, "borderColor")) {
    style.borderColor = theme.colors[borderThemeColor];
  }
  style.borderRadius = borderRadius;
  if (border && !style.borderWidth) {
    style.borderWidth = 1;
  }
  return style;
}

export function RoundedBox({ children, ...props }: RoundedBoxProps) {
  return <RnView style={useRoundedStyle(props)} children={children} />;
}

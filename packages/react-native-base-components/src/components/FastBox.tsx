import React, { PropsWithChildren } from "react";
import { View as RnView, ViewStyle } from "react-native";

// No color in these props so it's compatible with Native Base style props
export interface FastBoxProps
  extends PropsWithChildren,
    Pick<
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
      | "maxWidth"
      | "top"
      | "bottom"
      | "height"
      | "maxHeight"
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
      | "opacity"
    > {
  flexDir?: ViewStyle["flexDirection"];
  w?: ViewStyle["width"];
  maxW?: ViewStyle["maxWidth"];
  h?: ViewStyle["height"];
  maxH?: ViewStyle["maxHeight"];
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
}

function createStyle(props: Omit<FastBoxProps, "children" | "dynamicProps">) {
  return {
    flex: props.flex,
    flexDirection: props.flexDirection ?? props.flexDir,
    flexGrow: props.flexGrow,
    flexShrink: props.flexShrink,
    flexWrap: props.flexWrap,
    gap: props.gap,
    rowGap: props.rowGap,
    columnGap: props.columnGap,
    position: props.position,
    alignSelf: props.alignSelf,
    alignItems: props.alignItems,
    alignContent: props.alignContent,
    justifyContent: props.justifyContent,
    left: props.left,
    right: props.right,
    width: props.width ?? props.w,
    maxWidth: props.maxWidth ?? props.maxW,
    top: props.top,
    bottom: props.bottom,
    height: props.height ?? props.h,
    maxHeight: props.maxHeight ?? props.maxH,
    padding: props.padding ?? props.p,
    paddingHorizontal: props.paddingHorizontal ?? props.px,
    paddingVertical: props.paddingVertical ?? props.py,
    paddingTop: props.paddingTop ?? props.pt,
    paddingBottom: props.paddingBottom ?? props.pb,
    paddingLeft: props.paddingLeft ?? props.pl,
    paddingRight: props.paddingRight ?? props.pr,
    margin: props.margin ?? props.m,
    marginHorizontal: props.marginHorizontal ?? props.mx,
    marginVertical: props.marginVertical ?? props.my,
    marginTop: props.marginTop ?? props.mt,
    marginBottom: props.marginBottom ?? props.mb,
    marginLeft: props.marginLeft ?? props.ml,
    marginRight: props.marginRight ?? props.mr,
    borderStyle: props.borderStyle,
    borderWidth: props.borderWidth,
    opacity: props.opacity,
  };
}

/**
 * Simpler and (much) faster version or Native Base Box component without theme
 * support and with less props. Most notably it doesn't have a background color.
 */
export function FastBox({ children, ...props }: FastBoxProps) {
  return <RnView style={createStyle(props)} children={children} />;
}

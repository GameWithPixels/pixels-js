import React, { PropsWithChildren } from "react";
// eslint-disable-next-line import/namespace
import { View as RnView, ViewStyle } from "react-native";

export interface FastBoxProps
  extends PropsWithChildren,
    Pick<
      ViewStyle,
      | "flex"
      | "flexDirection"
      | "flexGrow"
      | "flexWrap"
      | "alignSelf"
      | "alignItems"
      | "alignContent"
      | "justifyContent"
      | "width"
      | "maxWidth"
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
      | "borderColor"
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

/**
 * Simpler and (much) faster version or Native Base Box component without theme
 * support and with less props. Most notably it doesn't have a background color.
 * @remarks Consider using Native Base View if you need theming or more props.
 */
export function FastBox({ children, ...props }: FastBoxProps) {
  const style = React.useMemo(
    () => ({
      flex: props.flex,
      flexDirection: props.flexDirection ?? props.flexDir,
      flexGrow: props.flexGrow,
      flexWrap: props.flexWrap,
      alignSelf: props.alignSelf,
      alignItems: props.alignItems,
      alignContent: props.alignContent,
      justifyContent: props.justifyContent,
      width: props.width ?? props.w,
      maxWidth: props.maxWidth ?? props.maxW,
      height: props.height ?? props.h,
      maxHeight: props.maxHeight ?? props.maxH,
      padding: props.width ?? props.p,
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
      borderColor: props.borderColor,
      borderStyle: props.borderStyle,
      borderWidth: props.borderWidth,
      opacity: props.opacity,
    }),
    [
      props.alignContent,
      props.alignItems,
      props.alignSelf,
      props.borderColor,
      props.borderStyle,
      props.borderWidth,
      props.flex,
      props.flexDir,
      props.flexDirection,
      props.flexGrow,
      props.flexWrap,
      props.h,
      props.height,
      props.justifyContent,
      props.m,
      props.margin,
      props.marginBottom,
      props.marginHorizontal,
      props.marginLeft,
      props.marginRight,
      props.marginTop,
      props.marginVertical,
      props.maxH,
      props.maxHeight,
      props.maxW,
      props.maxWidth,
      props.mb,
      props.ml,
      props.mr,
      props.mt,
      props.mx,
      props.my,
      props.opacity,
      props.p,
      props.paddingBottom,
      props.paddingHorizontal,
      props.paddingLeft,
      props.paddingRight,
      props.paddingTop,
      props.paddingVertical,
      props.pb,
      props.pl,
      props.pr,
      props.pt,
      props.px,
      props.py,
      props.w,
      props.width,
    ]
  );
  return <RnView style={style} children={children} />;
}

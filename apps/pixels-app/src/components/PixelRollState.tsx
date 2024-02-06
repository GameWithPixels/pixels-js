import { usePixelValue } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Text, TextProps } from "react-native-paper";

export function PixelRollState({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TextProps<string>, "children">) {
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return (
    <Text {...props}>
      Die is{" "}
      {rolling ? "rolling" : `on face ${rollState?.face ?? pixel.currentFace}`}
    </Text>
  );
}

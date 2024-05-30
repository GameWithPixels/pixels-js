import { usePixelEvent } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Text, TextProps } from "react-native-paper";

export function PixelRollState({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TextProps<string>, "children">) {
  const [rollEv] = usePixelEvent(pixel, "roll");
  const rolling = rollEv?.state === "rolling" || rollEv?.state === "handling";
  return (
    <Text {...props}>
      Die is{" "}
      {rolling
        ? "rolling"
        : `on face ${rollEv ? rollEv.face : pixel.currentFace}`}
    </Text>
  );
}

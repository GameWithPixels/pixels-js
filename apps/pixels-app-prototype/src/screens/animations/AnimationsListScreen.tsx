import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import { AnimationsList } from "./components/AnimationsList";

import { AnimationsListScreenProps } from "~/navigation";

export function AnimationsListScreen({
  navigation,
}: AnimationsListScreenProps) {
  return (
    <PixelAppPage>
      <AnimationsList navigation={navigation} />
    </PixelAppPage>
  );
}

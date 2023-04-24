import {
  FastHStack,
  Toggle,
} from "@systemic-games/react-native-base-components";
import { Text, View } from "native-base";
import React from "react";

import { FaceSelector, FaceSelectorProps } from "../components/FaceSelector";

export interface PlaybackFaceWidgetProps
  extends Omit<FaceSelectorProps, "disabled" | "backgroundColor" | "bg"> {
  defaultFace?: number;
}

export function PlaybackFaceWidget({
  title,
  value,
  onFaceChange: onChange,
  faceCount,
  defaultFace = 1,
  ...flexProps
}: PlaybackFaceWidgetProps) {
  const onToggle = React.useCallback(
    (on: boolean) => onChange?.(on ? defaultFace : -1),
    [defaultFace, onChange]
  );
  return (
    <View {...flexProps}>
      <Text bold>{title}</Text>
      <FastHStack alignItems="center">
        <Toggle
          value={value > 0}
          title="Current Face"
          onValueChange={onToggle}
        />
        <FaceSelector
          ml={3}
          flexGrow={1}
          value={value}
          onFaceChange={onChange}
          faceCount={faceCount}
          disabled={value <= 0}
        />
      </FastHStack>
    </View>
  );
}

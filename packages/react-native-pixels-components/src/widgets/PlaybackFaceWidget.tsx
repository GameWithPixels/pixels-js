import {
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Switch, Text } from "react-native-paper";

import { FaceSelector, FaceSelectorProps } from "../components/FaceSelector";

export interface PlaybackFaceWidgetProps
  extends Omit<FaceSelectorProps, "disabled" | "backgroundColor" | "bg"> {
  title: string;
  defaultFace?: number;
}

export function PlaybackFaceWidget({
  title,
  face: value,
  onFaceSelect: onChange,
  faceCount,
  defaultFace = 1,
  ...flexProps
}: PlaybackFaceWidgetProps) {
  const onToggle = React.useCallback(
    (on: boolean) => onChange?.(on ? defaultFace : -1),
    [defaultFace, onChange]
  );
  return (
    <BaseVStack {...flexProps}>
      <Text variant="titleMedium">{title}</Text>
      <BaseHStack alignItems="center" gap={5}>
        <Text>Current Face</Text>
        <Switch value={value > 0} onValueChange={onToggle} />
        <FaceSelector
          flexGrow={1}
          faceCount={faceCount}
          face={value}
          onFaceSelect={onChange}
          disabled={value <= 0}
        />
      </BaseHStack>
    </BaseVStack>
  );
}

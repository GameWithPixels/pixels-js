import {
  FastHStack,
  FastVStack,
  Toggle,
} from "@systemic-games/react-native-base-components";
import { Text } from "native-base";
import React from "react";

import { FaceSelector, FaceSelectorProps } from "./FaceSelector";

export interface PlaybackFaceProps extends Omit<FaceSelectorProps, "disabled"> {
  defaultFace?: number;
}

export function PlaybackFace({
  title,
  value,
  onChange,
  defaultFace = 1,
  ...props
}: PlaybackFaceProps) {
  const onToggle = React.useCallback(
    (on: boolean) => onChange?.(on ? defaultFace : -1),
    [defaultFace, onChange]
  );
  return (
    <FastVStack w="100%">
      <Text bold>{title}</Text>
      <FastHStack alignItems="center">
        <Toggle value={value >= 0} title={title} onValueChange={onToggle} />
        <FaceSelector
          disabled={value < 0}
          value={value}
          onChange={onChange}
          {...props}
        />
      </FastHStack>
    </FastVStack>
  );
}

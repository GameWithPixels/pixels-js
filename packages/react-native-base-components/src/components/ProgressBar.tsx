import { Box, Progress, Text, usePropsResolution } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";

export interface ProgressBarProps {
  progress?: number;
  loadingText?: string;
  boxBg?: ColorType;
  size?: SizeType;
  filledTrackBg?: ColorType;
  onProgressEnd?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ProgressBar(props: ProgressBarProps) {
  const resolvedProps = usePropsResolution(
    "ProgressBar",
    props
  ) as ProgressBarProps;
  return (
    <Box bg={resolvedProps.boxBg} p="3" rounded="lg">
      <Progress
        value={props.progress}
        size={resolvedProps.size}
        _filledTrack={{
          bg: resolvedProps.filledTrackBg,
        }}
      />
      <Text>
        {props.loadingText
          ? props.loadingText + props.progress + "%"
          : props.progress + "%"}
      </Text>
    </Box>
  );
}

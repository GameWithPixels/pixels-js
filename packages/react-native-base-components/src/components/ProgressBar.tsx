import { Box, Progress, Text, usePropsResolution } from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

interface ProgressBarProps {
  value: number;
  loadingText?: string;
  boxBg?: ColorType;
  filledTrackBg?: ColorType;
  onProgressEnd?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ProgressBar(props: ProgressBarProps) {
  const resolvedProps = usePropsResolution("BaseProgressBar", props);
  return (
    <Box bg={resolvedProps.boxBg} p="3" rounded="lg">
      <Progress
        value={props.value}
        size={resolvedProps.size}
        _filledTrack={{
          bg: resolvedProps.filledTrackBg,
        }}
      />
      <Text>
        {props.loadingText
          ? props.loadingText + props.value + "%"
          : props.value + "%"}
      </Text>
    </Box>
  );
}

import { Box, Progress, Text, usePropsResolution } from "native-base";
import { IProgressProps } from "native-base/lib/typescript/components/composites";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

interface progressBarProps extends IProgressProps {
  loadingText?: string;
  boxBg?: ColorType;
  filledTrackBg?: ColorType;
  onProgressEnd?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ProgressBar(props: progressBarProps) {
  // TODO add and use resolvedProps from theme
  // TODO progressValue never changed, this is a problem
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progressValue, setProgressValue] = React.useState(props.value);
  const resolvedProps = usePropsResolution("BaseProgressBar", props);

  return (
    <Box bg={resolvedProps.boxBg} p="3" rounded="lg">
      <Progress
        value={progressValue}
        size={resolvedProps.size}
        _filledTrack={{
          bg: resolvedProps.filledTrackBg,
        }}
      />
      <Text>
        {props.loadingText
          ? props.loadingText + progressValue + "%"
          : progressValue + "%"}
      </Text>
    </Box>
  );
}

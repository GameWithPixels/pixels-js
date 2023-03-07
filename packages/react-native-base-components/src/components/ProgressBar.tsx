import { Progress, Text, usePropsResolution, View } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";

/**
 * Props for {@link ProgressBar} component.
 */
export interface ProgressBarProps {
  progress?: number; // current progress value
  loadingText?: string; // text placed before percentage value
  boxBg?: ColorType;
  size?: SizeType; // size possibilities of the progressbar
  filledTrackBg?: ColorType;
  showPercentage?: boolean; // show or hide current percentage progress
  onProgressEnd?: (() => void) | null | undefined; // function to be executed when progress end
}

/**
 * A progress bar with current progress value display.
 * @param props See {@link ProgressBarProps} for props parameters.
 */
export function ProgressBar(props: ProgressBarProps) {
  const resolvedProps = usePropsResolution(
    "ProgressBar",
    props
  ) as ProgressBarProps;
  return (
    <View bg={resolvedProps.boxBg} p="3" rounded="lg">
      <Progress
        value={props.progress}
        size={resolvedProps.size}
        _filledTrack={{
          bg: resolvedProps.filledTrackBg,
        }}
      />
      {props.showPercentage && (
        <Text>
          {props.loadingText
            ? props.loadingText + props.progress + "%"
            : props.progress + "%"}
        </Text>
      )}
    </View>
  );
}

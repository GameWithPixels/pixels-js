import {
  Text,
  Slider,
  Spacer,
  usePropsResolution,
  ISliderProps,
  View,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

import { FastHStack } from "./FastHStack";
import { FastVStack } from "./FastVStack";

export interface SliderProps extends ISliderProps {
  sliderTitle?: string;
  minValue?: number;
  maxValue?: number;
  unitType?: string;
  unitTextColor?: ColorType;
  sliderThumbColor?: ColorType;
  sliderTrackColor?: ColorType;
  sliderBoxColor?: ColorType;
  onSelectedValue?: (value: number) => void;
  onValueChange?: (() => void) | null | undefined;
}

export function SliderComponent(props: SliderProps) {
  const defaultValue = props.defaultValue;
  const [onChangeValue, setOnChangeValue] = React.useState(defaultValue);
  const resolvedProps = usePropsResolution("Slider", props);
  return (
    <FastVStack>
      <Text bold>{resolvedProps.sliderTitle}</Text>
      <FastHStack mt={1} alignItems="center">
        <View
          w={resolvedProps.sliderBoxWidth}
          rounded={resolvedProps.rounded}
          px={resolvedProps.sliderBoxPx}
          py={resolvedProps.sliderBoxPy}
          bg={resolvedProps.boxColor}
        >
          <Slider
            {...resolvedProps}
            defaultValue={resolvedProps.defaultValue}
            minValue={resolvedProps.minValue}
            maxValue={resolvedProps.maxValue}
            size={resolvedProps.size}
            step={resolvedProps.step}
            onChange={(v) => {
              setOnChangeValue(v);
              props.onSelectedValue?.(v);
            }}
          >
            <Slider.Track shadow={1}>
              <Slider.FilledTrack bg={resolvedProps.trackColor} />
            </Slider.Track>
            <Slider.Thumb bg={resolvedProps.thumbColor} />
          </Slider>
        </View>
        <Spacer />
        <View
          rounded={resolvedProps.rounded}
          px={resolvedProps.unitBoxPx}
          py={resolvedProps.unitBoxPy}
          minH={10}
          minW={resolvedProps.unitBoxMinWidth}
          bg={resolvedProps.boxColor}
        >
          <Text alignSelf="center">
            {props.unitType ? onChangeValue + props.unitType : onChangeValue}
          </Text>
        </View>
      </FastHStack>
    </FastVStack>
  );
}

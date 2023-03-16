import {
  Text,
  Slider,
  Spacer,
  usePropsResolution,
  ISliderProps,
  View,
} from "native-base";
import React from "react";

import { FastHStack } from "./FastHStack";
import { FastVStack } from "./FastVStack";

export interface SliderProps extends ISliderProps {
  sliderTitle?: string;
  minValue?: number;
  maxValue?: number;
  unitType?: string;
  onValueChange?: (value: number) => void;
}

export function SliderComponent(props: SliderProps) {
  const resolvedProps = usePropsResolution("Slider", props);
  const defaultValue = props.defaultValue;
  const [onChangeValue, setOnChangeValue] = React.useState(defaultValue);
  const onChange = React.useCallback(
    (value: number) => {
      setOnChangeValue(value);
      props.onValueChange?.(value);
    },
    [props]
  );
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
            onChange={onChange}
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

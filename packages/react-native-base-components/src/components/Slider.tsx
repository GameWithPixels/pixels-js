import {
  Text,
  HStack,
  VStack,
  Slider,
  Box,
  Spacer,
  usePropsResolution,
  ISliderProps,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

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
  const [onChangeValue, setOnChangeValue] = React.useState(0.1);
  const resolvedProps = usePropsResolution("Slider", props);
  return (
    <VStack space={1}>
      <Text bold>{resolvedProps.sliderTitle}</Text>
      <HStack space={2.5} alignItems="center">
        <Box
          w={resolvedProps.sliderBoxWidth}
          rounded={resolvedProps.rounded}
          px={resolvedProps.sliderBoxPx}
          py={resolvedProps.sliderBoxPy}
          bg={resolvedProps.boxColor}
        >
          <Slider
            {...resolvedProps}
            defaultValue={resolvedProps.minValue}
            minValue={resolvedProps.minValue}
            maxValue={resolvedProps.maxValue}
            size={resolvedProps.size}
            step={resolvedProps.step}
            onChange={(v) => {
              setOnChangeValue(v);
              resolvedProps.onSelectedValue?.(v);
            }}
          >
            <Slider.Track shadow={1}>
              <Slider.FilledTrack bg={resolvedProps.trackColor} />
            </Slider.Track>
            <Slider.Thumb bg={resolvedProps.thumbColor} />
          </Slider>
        </Box>
        <Spacer />
        <Box
          rounded={resolvedProps.rounded}
          px={resolvedProps.unitBoxPx}
          py={resolvedProps.unitBoxPy}
          minH={10}
          minW={resolvedProps.unitBoxMinWidth}
          bg={resolvedProps.boxColor}
        >
          <Text alignSelf="center">{onChangeValue + resolvedProps.unit}</Text>
        </Box>
      </HStack>
    </VStack>
  );
}

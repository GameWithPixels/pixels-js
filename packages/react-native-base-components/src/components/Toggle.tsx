import {
  HStack,
  Switch,
  ISwitchProps,
  Text,
  usePropsResolution,
} from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React, { ReactNode } from "react";

/**
 * Props for {@link Toggle} component.
 */
export interface ToggleProps extends ISwitchProps {
  title?: string; // Text displayed on the left of the toggle
  textSize?: string | number | SizeType;
  toggleSize?: SizeType;
  space?: number | string; // Spacing between text and toggle
  icon?: ReactNode | ReactNode[]; // Icon displayed ont the left of the toggle
}

/**
 * Toggle component to display a toggle with an icon and/or text.
 * Use OnValueChangeProps in order to get toggle events.
 * @param props See {@link ToggleProps} for props parameters.
 */
export function Toggle(props: ToggleProps) {
  const resolvedProps = usePropsResolution("Toggle", props) as ToggleProps;
  return (
    <HStack space={resolvedProps.space} alignItems="center">
      <Text fontSize={props.textSize}>{props.title}</Text>
      {props.icon}
      <Switch
        {...resolvedProps}
        onThumbColor={resolvedProps.onThumbColor}
        offThumbColor={resolvedProps.offThumbColor}
        onTrackColor={resolvedProps.onTrackColor}
        size={resolvedProps.toggleSize}
      />
    </HStack>
  );
}

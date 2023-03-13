import {
  Switch,
  ISwitchProps,
  Text,
  usePropsResolution,
  IBoxProps,
  ITextProps,
} from "native-base";
import React from "react";

import { FastHStack } from "./FastHStack";

/**
 * Props for {@link Toggle} component.
 */
export interface ToggleProps extends ISwitchProps {
  title?: string; // Text displayed on the left of the toggle
  toggleSize?: IBoxProps["size"];
  fontSize?: ITextProps["fontSize"];
  space?: number | string; // Spacing between text and toggle
}

/**
 * Toggle component to display a toggle with an icon and/or text.
 * Use OnValueChangeProps in order to get toggle events.
 * @param props See {@link ToggleProps} for props parameters.
 */
export function Toggle(props: ToggleProps) {
  const {
    title,
    fontSize: textSize,
    children,
    ...resolvedProps
  } = usePropsResolution("Toggle", props) as ToggleProps;
  return (
    <FastHStack alignItems="center">
      <Text mr={resolvedProps.space} fontSize={textSize}>
        {title}
      </Text>
      {children}
      <Switch
        {...resolvedProps}
        ml={children ? resolvedProps.space : 0}
        size={resolvedProps.toggleSize}
      />
    </FastHStack>
  );
}

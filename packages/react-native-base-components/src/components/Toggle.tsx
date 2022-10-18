import {
  HStack,
  Switch,
  ISwitchProps,
  Text,
  usePropsResolution,
} from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React from "react";

interface ToggleProps extends ISwitchProps {
  text: string;
  toggleSize?: SizeType;
  space?: number | string;
  leftSideChildren?: JSX.Element | JSX.Element[];
  rightSideChildren?: JSX.Element | JSX.Element[];
}

export function Toggle(props: ToggleProps) {
  const resolvedProps = usePropsResolution("BaseToggle", props);
  return (
    <HStack space={resolvedProps.space} alignItems="center">
      <Text>{props.text}</Text>
      {props.leftSideChildren}
      <Switch
        onThumbColor={resolvedProps.onThumbColor}
        offThumbColor={resolvedProps.offThumbColor}
        onTrackColor={resolvedProps.onTrackColor}
        size={resolvedProps.toggleSize}
        onChange={props.onToggle}
        defaultIsChecked={false}
      />
      {props.rightSideChildren}
    </HStack>
  );
}

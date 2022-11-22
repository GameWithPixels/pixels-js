import {
  HStack,
  Switch,
  ISwitchProps,
  Text,
  usePropsResolution,
} from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import { ReactNode } from "react";

export interface ToggleProps extends ISwitchProps {
  text?: string;
  textSize?: string | number | SizeType;
  toggleSize?: SizeType;
  space?: number | string;
  Icon?: ReactNode | ReactNode[];
}

export function Toggle(props: ToggleProps) {
  const resolvedProps = usePropsResolution("Toggle", props) as ToggleProps;
  return (
    <HStack space={resolvedProps.space} alignItems="center">
      <Text fontSize={props.textSize}>{props.text}</Text>
      {props.Icon}
      <Switch
        {...resolvedProps}
        onThumbColor={resolvedProps.onThumbColor}
        offThumbColor={resolvedProps.offThumbColor}
        onTrackColor={resolvedProps.onTrackColor}
        size={resolvedProps.toggleSize}
        onValueChange={props.onToggle}
        defaultIsChecked={false}
      />
    </HStack>
  );
}

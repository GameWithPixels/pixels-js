import {
  HStack,
  Switch,
  ISwitchProps,
  Text,
  usePropsResolution,
} from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";

interface ToggleProps extends ISwitchProps {
  text: string;
  toggleSize?: SizeType;
  space?: number | string;
}

export function Toggle(props: ToggleProps) {
  const resolvedProps = usePropsResolution("Toggle", props);
  return (
    <HStack space={resolvedProps.space} alignItems="center">
      <Text>{props.text}</Text>
      {props.children}
      <Switch
        {...resolvedProps}
        onThumbColor={resolvedProps.onThumbColor}
        offThumbColor={resolvedProps.offThumbColor}
        onTrackColor={resolvedProps.onTrackColor}
        size={resolvedProps.toggleSize}
        onChange={props.onToggle}
        defaultIsChecked={false}
      />
    </HStack>
  );
}

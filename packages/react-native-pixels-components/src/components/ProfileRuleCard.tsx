import {
  expandShorthandStyle,
  FastFlexProps,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { FlexStyle } from "react-native";
import {
  Text,
  TouchableRipple,
  TouchableRippleProps,
} from "react-native-paper";

export interface ProfileRuleCardProps extends FastFlexProps {
  condition?: string;
  actions?: string[];
  onPress?: TouchableRippleProps["onPress"];
  onLongPress?: TouchableRippleProps["onLongPress"];
  disabled?: TouchableRippleProps["disabled"];
  contentGap?: FlexStyle["gap"];
}

export function ProfileRuleCard({
  condition,
  actions,
  onPress,
  onLongPress,
  disabled,
  contentGap = 10,
  ...flexProps
}: ProfileRuleCardProps) {
  return (
    <TouchableRipple
      style={expandShorthandStyle(flexProps)}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <FastVStack w="100%" gap={contentGap}>
        <FastHStack alignItems="center">
          <Text variant="bodyLarge">When: </Text>
          <Text>{condition}</Text>
        </FastHStack>
        {actions?.map((action, i) => (
          <FastHStack key={i} alignItems="center">
            <Text variant="bodyLarge">Then: </Text>
            <Text>{action}</Text>
          </FastHStack>
        ))}
      </FastVStack>
    </TouchableRipple>
  );
}

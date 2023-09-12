import {
  expandShorthandStyle,
  BaseFlexProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import { FlexStyle } from "react-native";
import {
  Text,
  TouchableRipple,
  TouchableRippleProps,
} from "react-native-paper";

export interface ProfileRuleCardProps extends BaseFlexProps {
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
      <BaseVStack w="100%" gap={contentGap}>
        <BaseHStack alignItems="center">
          <Text variant="bodyLarge">When: </Text>
          <Text>{condition}</Text>
        </BaseHStack>
        {actions?.map((action, i) => (
          <BaseHStack key={i} alignItems="center">
            <Text variant="bodyLarge">Then: </Text>
            <Text>{action}</Text>
          </BaseHStack>
        ))}
      </BaseVStack>
    </TouchableRipple>
  );
}

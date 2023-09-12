import {
  ActionsheetList,
  ActionsheetListItemData,
  BaseStyles,
  BaseButton,
  BaseFlexProps,
  BaseHStack,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export interface RuleConditionSelectorProps extends BaseFlexProps {
  label: string;
  conditions: ActionsheetListItemData[];
}

export function RuleConditionSelector({
  label,
  conditions,
  ...flexProps
}: RuleConditionSelectorProps) {
  const { visible, show, hide } = useVisibility();
  return (
    <>
      <BaseHStack alignItems="center" {...flexProps}>
        <Text variant="titleMedium">When</Text>
        <View style={BaseStyles.spacer} />
        <BaseButton onPress={show}>{label}</BaseButton>
        <View style={BaseStyles.spacer} />
      </BaseHStack>

      <ActionsheetList
        visible={visible}
        onClose={hide}
        itemsData={conditions}
      />
    </>
  );
}

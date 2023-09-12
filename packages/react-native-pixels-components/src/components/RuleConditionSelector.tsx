import {
  ActionsheetList,
  ActionsheetListItemData,
  BaseStyles,
  BaseButton,
  BaseFlexProps,
  BaseHStack,
  useDisclose,
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
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <BaseHStack alignItems="center" {...flexProps}>
        <Text variant="titleMedium">When</Text>
        <View style={BaseStyles.spacer} />
        <BaseButton onPress={onOpen}>{label}</BaseButton>
        <View style={BaseStyles.spacer} />
      </BaseHStack>

      <ActionsheetList
        isOpen={isOpen}
        onClose={onClose}
        itemsData={conditions}
      />
    </>
  );
}

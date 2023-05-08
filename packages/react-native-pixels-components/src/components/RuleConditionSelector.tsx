import {
  ActionsheetList,
  ActionsheetListItemData,
  BaseStyles,
  FastButton,
  FastFlexProps,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export interface RuleConditionSelectorProps extends FastFlexProps {
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
      <FastHStack alignItems="center" {...flexProps}>
        <Text variant="titleMedium">When</Text>
        <View style={BaseStyles.spacer} />
        <FastButton onPress={onOpen}>{label}</FastButton>
        <View style={BaseStyles.spacer} />
      </FastHStack>

      <ActionsheetList
        isOpen={isOpen}
        onClose={onClose}
        itemsData={conditions}
      />
    </>
  );
}

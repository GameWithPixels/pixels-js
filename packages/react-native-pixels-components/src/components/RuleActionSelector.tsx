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

export interface RuleActionSelectorProps extends BaseFlexProps {
  actions: ActionsheetListItemData[];
  title?: string;
}

export function RuleActionSelector({
  actions,
  title,
  ...flexProps
}: RuleActionSelectorProps) {
  const { visible, show, hide } = useVisibility();
  return (
    <>
      <BaseHStack alignItems="center" {...flexProps}>
        <Text variant="bodyLarge">Then</Text>
        <View style={BaseStyles.spacer} />
        <BaseButton onPress={show}>{title}</BaseButton>
        <View style={BaseStyles.spacer} />
      </BaseHStack>

      <ActionsheetList visible={visible} onClose={hide} itemsData={actions} />
    </>
  );
}

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

export interface RuleActionSelectorProps extends FastFlexProps {
  actions: ActionsheetListItemData[];
  title?: string;
}

export function RuleActionSelector({
  actions,
  title,
  ...flexProps
}: RuleActionSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastHStack alignItems="center" {...flexProps}>
        <Text variant="bodyLarge">Then</Text>
        <View style={BaseStyles.spacer} />
        <FastButton onPress={onOpen}>{title}</FastButton>
        <View style={BaseStyles.spacer} />
      </FastHStack>

      <ActionsheetList isOpen={isOpen} onClose={onClose} itemsData={actions} />
    </>
  );
}

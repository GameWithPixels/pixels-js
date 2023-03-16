import {
  ActionsheetListItemData,
  ActionsheetScrollView,
  FastBoxProps,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Text, ChevronDownIcon, Pressable, View } from "native-base";
import React from "react";

export interface RuleActionSelectorProps extends FastBoxProps {
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
        <Text fontSize="2xl" flex={1}>
          Then
        </Text>
        <Pressable flex={2} onPress={onOpen}>
          <View
            flexDir="row"
            p={2}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Text fontSize="sm" flexGrow={1}>
              {title}
            </Text>
            <ChevronDownIcon />
          </View>
        </Pressable>
      </FastHStack>

      <ActionsheetScrollView
        isOpen={isOpen}
        onClose={onClose}
        itemsData={actions}
      />
    </>
  );
}

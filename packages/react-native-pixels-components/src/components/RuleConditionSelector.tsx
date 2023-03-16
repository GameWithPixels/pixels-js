import {
  ActionsheetListItemData,
  ActionsheetScrollView,
  FastBox,
  FastBoxProps,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Text, ChevronDownIcon, Spacer, Pressable, View } from "native-base";
import React from "react";

export interface RuleConditionSelectorProps extends FastBoxProps {
  conditions: ActionsheetListItemData[];
  title?: string;
}

export function RuleConditionSelector({
  conditions,
  title,
  ...flexProps
}: RuleConditionSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastHStack alignItems="center" {...flexProps}>
        <Text fontSize="2xl" flex={1}>
          When
        </Text>
        <Pressable flex={2} onPress={onOpen}>
          <View
            flexDir="row"
            p={3}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Text fontSize="sm" flex={2}>
              {title}
            </Text>
            <Spacer />
            <FastBox>
              <ChevronDownIcon />
            </FastBox>
          </View>
        </Pressable>
      </FastHStack>

      <ActionsheetScrollView
        isOpen={isOpen}
        onClose={onClose}
        itemsData={conditions}
      />
    </>
  );
}

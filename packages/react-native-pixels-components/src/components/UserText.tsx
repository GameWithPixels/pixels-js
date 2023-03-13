import {
  ActionsheetList,
  FastButton,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { ITextProps, Input, Text, View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

export interface UserTextProps extends IViewProps {
  title?: string; // Text displayed above the input
  textSize?: ITextProps["fontSize"];
  space?: number | string; // Spacing between text and toggle
  value?: string | undefined;
  onValueChange?: (valueOrUuid: string) => void;
  availableTexts?: string[];
}

export function UserText({
  title,
  textSize,
  space = 3,
  value,
  onValueChange,
  availableTexts,
  ...flexProps
}: UserTextProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const data = React.useMemo(
    () =>
      [...new Set(availableTexts)]
        .sort()
        .map((label) => ({ label, onSelect: onValueChange })),
    [availableTexts, onValueChange]
  );
  return (
    <>
      <View {...flexProps}>
        <Text bold fontSize={textSize}>
          {title}
        </Text>
        <FastHStack mt={space}>
          <Input
            flex={1}
            bg="pixelColors.highlightGray"
            variant="filled"
            placeholder="Type Text"
            placeholderTextColor="gray.400"
            value={value}
            onChangeText={onValueChange}
          />
          {!!data.length && (
            <FastButton ml={3} onPress={onOpen}>
              ...
            </FastButton>
          )}
        </FastHStack>
      </View>

      {/* Actionsheet drawer */}
      <ActionsheetList
        title="Select A Text"
        itemsData={data}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}

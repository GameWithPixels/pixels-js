import {
  ActionsheetList,
  FastButton,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { ITextProps, Input, Text } from "native-base";
import React from "react";

export interface UserTextSelectionProps {
  title?: string; // Text displayed above the input
  textSize?: ITextProps["fontSize"];
  space?: number | string; // Spacing between text and toggle
  value?: string | undefined;
  onValueChange?: (valueOrUuid: string) => void;
  availableTexts?: string[];
}

export function UserTextSelection({
  title,
  textSize,
  space = 3,
  value,
  onValueChange,
  availableTexts,
}: UserTextSelectionProps) {
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
      <FastVStack>
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
      </FastVStack>

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

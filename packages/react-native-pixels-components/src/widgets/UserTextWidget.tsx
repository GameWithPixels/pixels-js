import {
  ActionsheetList,
  FastBoxProps,
  FastButton,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { ITextProps, Input, Text } from "native-base";
import React from "react";

export interface UserTextWidgetProps extends FastBoxProps {
  title?: string; // Text displayed above the input
  fontSize?: ITextProps["fontSize"];
  space?: number | string; // Spacing between text and toggle
  value?: string;
  onValueChange: (valueOrUuid: string) => void;
  availableTexts?: string[];
}

export function UserTextWidget({
  title,
  fontSize,
  space = 3,
  value,
  onValueChange: onChange,
  availableTexts,
  ...flexProps
}: UserTextWidgetProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const data = React.useMemo(
    () =>
      [...new Set(availableTexts)]
        .sort()
        .map((label) => ({ label, onSelect: onChange })),
    [availableTexts, onChange]
  );
  return (
    <>
      <FastVStack {...flexProps}>
        <Text bold fontSize={fontSize}>
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
            onChangeText={onChange}
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

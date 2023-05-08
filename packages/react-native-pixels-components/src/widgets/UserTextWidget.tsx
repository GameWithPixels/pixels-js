import {
  ActionsheetList,
  BaseStyles,
  FastButton,
  FastFlexProps,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text, TextInput } from "react-native-paper";

export interface UserTextWidgetProps extends FastFlexProps {
  title: string; // Text displayed above the input
  space?: number; // Spacing between text and toggle
  value?: string;
  onValueChange: (valueOrUuid: string) => void;
  availableTexts?: string[];
}

export function UserTextWidget({
  title,
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
        <Text variant="titleMedium">{title}</Text>
        <FastHStack mt={space}>
          <TextInput
            style={BaseStyles.flex}
            // bg="pixelColors.highlightGray"
            // variant="filled"
            placeholder="Type Text"
            // placeholderTextColor="gray"
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

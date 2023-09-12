import {
  ActionsheetList,
  BaseStyles,
  BaseButton,
  BaseFlexProps,
  BaseHStack,
  BaseVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { Text, TextInput } from "react-native-paper";

export interface UserTextWidgetProps extends BaseFlexProps {
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
      <BaseVStack {...flexProps}>
        <Text variant="titleMedium">{title}</Text>
        <BaseHStack mt={space}>
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
            <BaseButton ml={3} onPress={onOpen}>
              ...
            </BaseButton>
          )}
        </BaseHStack>
      </BaseVStack>

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

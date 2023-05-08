import {
  FastButton,
  FastFlexProps,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { ScrollView } from "react-native";
import {
  Card,
  Checkbox,
  CheckboxItemProps,
  Modal,
  ModalProps,
  Portal,
  Text,
} from "react-native-paper";

import { useModalStyle } from "../theme";

function BatteryConditionTitleFromOptions(selectedButtons: string[]): string {
  const title = selectedButtons.length
    ? "Battery is " +
      selectedButtons
        .map((title) => {
          return title;
        })
        .join(" or ")
    : "Empty Selection";
  return title;
}

interface SelectableButtonProps extends Omit<CheckboxItemProps, "status"> {
  isSelected: boolean;
  onToggle?: (title: string) => void;
}

function SelectableButton({
  label,
  isSelected,
  onToggle,
  ...props
}: SelectableButtonProps) {
  const onPress = React.useCallback(() => onToggle?.(label), [onToggle, label]);
  return (
    <Checkbox.Item
      label={label}
      status={isSelected ? "checked" : "unchecked"}
      onPress={onPress}
      {...props}
    />
  );
}

export interface ItemData {
  title?: string;
  onPress?: () => void;
}

export interface BitFieldWidgetProps extends FastFlexProps {
  title: string;
  availableValues: string[];
  values: string[];
  onToggleValue?: (value: string) => void;
}

export function BitFieldWidget({
  title,
  availableValues,
  values,
  onToggleValue,
  ...flexProps
}: BitFieldWidgetProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...flexProps}>
        <Text variant="titleMedium">{title}</Text>
        <FastHStack justifyContent="space-around">
          {availableValues.length < 4 ? (
            availableValues.map((item) => (
              <SelectableButton
                key={item}
                label={item}
                isSelected={values.includes(item)}
                onToggle={onToggleValue}
              />
            ))
          ) : (
            <FastButton onPress={onOpen}>
              {BatteryConditionTitleFromOptions(values)}
            </FastButton>
          )}
        </FastHStack>
      </FastVStack>

      <SelectBitFieldsModal
        visible={isOpen}
        onDismiss={onClose}
        availableValues={availableValues}
        values={values}
        onToggleValue={onToggleValue}
      />
    </>
  );
}

export interface SelectColorModalProps
  extends Pick<
      BitFieldWidgetProps,
      "availableValues" | "values" | "onToggleValue"
    >,
    Omit<ModalProps, "children"> {}

function SelectBitFieldsModal({
  onDismiss,
  availableValues,
  values,
  onToggleValue,
  ...props
}: SelectColorModalProps) {
  const modalStyle = useModalStyle();
  return (
    <Portal>
      <Modal
        contentContainerStyle={modalStyle}
        onDismiss={onDismiss}
        {...props}
      >
        <Card>
          <Card.Actions>
            <ScrollView>
              {availableValues.map((item) => (
                <SelectableButton
                  key={item}
                  label={item}
                  isSelected={values.includes(item)}
                  onToggle={onToggleValue}
                />
              ))}
            </ScrollView>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

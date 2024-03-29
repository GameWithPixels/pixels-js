import {
  BaseButton,
  BaseFlexProps,
  BaseHStack,
  BaseVStack,
  RoundedBox,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import React from "react";
import {
  Card,
  Checkbox,
  Modal,
  ModalProps,
  Portal,
  RadioButtonProps,
  Text,
  TextProps,
} from "react-native-paper";

import { useModalStyle } from "../theme";

export interface SelectFaceMaskProps {
  faces: number[];
  onFaceMaskChange: (faces: number[]) => void; // Function to be executed when the face selection is changed
  faceCount: number; // Number of faces on the die
  _checkBox?: RadioButtonProps;
}

/**
 * Props for {@link FaceMaskWidget} component.
 */
interface FaceMaskWidgetProps extends SelectFaceMaskProps, BaseFlexProps {
  _text?: Omit<TextProps<string>, "children">;
}

/**
 * Display die faces and select which faces will be used with lighting animations.
 * @param props See {@link FaceMaskWidgetProps} for props parameters.
 */
export function FaceMaskWidget({
  faces,
  onFaceMaskChange,
  faceCount,
  _text,
  _checkBox,
  ...flexProps
}: FaceMaskWidgetProps) {
  const faceList = React.useMemo(
    () => faces.sort((n1, n2) => n1 - n2).join(" / "),
    [faces]
  );
  const { visible, show, hide } = useVisibility();
  return (
    <>
      <BaseVStack {...flexProps}>
        <Text variant="titleMedium">Face mask</Text>
        <BaseHStack alignItems="center" gap={5}>
          <BaseButton onPress={show}>Edit</BaseButton>
          <RoundedBox border flex={1} py={10} alignItems="center">
            <Text {..._text}>
              {faces.length ? faceList : "No faces selected"}
            </Text>
          </RoundedBox>
        </BaseHStack>
      </BaseVStack>

      <SelectFacesModal
        _checkBox={_checkBox}
        visible={visible}
        onDismiss={hide}
        faces={faces}
        onFaceMaskChange={onFaceMaskChange}
        faceCount={faceCount}
      />
    </>
  );
}

export interface SelectFacesModalProps
  extends SelectFaceMaskProps,
    Omit<ModalProps, "children"> {}

export function SelectFacesModal({
  onDismiss,
  faces,
  onFaceMaskChange,
  faceCount,
  _checkBox,
  ...props
}: SelectFacesModalProps) {
  const allFaces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  const modalStyle = useModalStyle();
  return (
    <Portal>
      <Modal
        contentContainerStyle={modalStyle}
        onDismiss={onDismiss}
        {...props}
      >
        <Card>
          <Card.Title title="Die Faces" />
          <Card.Content>
            <BaseHStack flexWrap="wrap" gap={5}>
              {allFaces.map((f) => (
                <Checkbox.Item
                  key={f}
                  {..._checkBox}
                  status={faces.includes(f) ? "checked" : "unchecked"}
                  label={f.toString()}
                  onPress={() => {
                    const i = faces.indexOf(f);
                    if (i >= 0) {
                      onFaceMaskChange([
                        ...faces.slice(0, i),
                        ...faces.slice(i + 1),
                      ]);
                    } else {
                      onFaceMaskChange([...faces, f]);
                    }
                  }}
                />
              ))}
            </BaseHStack>
          </Card.Content>
          <Card.Actions>
            <BaseHStack gap={5}>
              <BaseButton
                onPress={() => {
                  onFaceMaskChange(allFaces);
                  onDismiss?.();
                }}
              >
                All
              </BaseButton>
              <BaseButton
                onPress={() => {
                  onFaceMaskChange([]);
                  onDismiss?.();
                }}
              >
                None
              </BaseButton>
            </BaseHStack>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

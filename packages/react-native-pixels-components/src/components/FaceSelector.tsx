import {
  BaseButton,
  BaseFlexProps,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { ScrollView } from "react-native";
import { Card, Modal, ModalProps, Portal, useTheme } from "react-native-paper";

import { useModalStyle } from "../theme";

export interface FaceSelectorProps extends BaseFlexProps {
  faceCount: number;
  face: number;
  onFaceSelect: (faceIndex: number) => void;
  disabled?: boolean;
}

export function FaceSelector({
  faceCount,
  face,
  onFaceSelect,
  disabled,
  ...flexProps
}: FaceSelectorProps) {
  const textStyle = React.useMemo(
    () => ({ style: { color: disabled ? "gray" : undefined } }),
    [disabled]
  );
  const { visible, show, hide } = useVisibility();
  const chooseFace = React.useCallback(
    (face: number) => {
      onFaceSelect?.(face);
      hide();
    },
    [onFaceSelect, hide]
  );
  return (
    <>
      <BaseButton
        onPress={show}
        disabled={disabled}
        color={disabled ? "gray" : undefined}
        _text={textStyle}
        {...flexProps}
      >
        {/* When no value render a space character so button doesn't change size */}
        {face > 0 ? face : " "}
      </BaseButton>

      <SelectFaceModal
        visible={visible}
        onDismiss={hide}
        faceCount={faceCount}
        face={face}
        onFaceSelect={chooseFace}
      />
    </>
  );
}

interface SelectFaceModalProps
  extends Pick<FaceSelectorProps, "faceCount" | "face" | "onFaceSelect">,
    Omit<ModalProps, "children"> {
  title?: string;
}
function SelectFaceModal({
  onDismiss,
  faceCount,
  face,
  onFaceSelect,
  title,
  ...props
}: SelectFaceModalProps) {
  const allFaces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  const modalStyle = useModalStyle();
  const theme = useTheme();
  return (
    <Portal>
      <Modal
        contentContainerStyle={modalStyle}
        onDismiss={onDismiss}
        {...props}
      >
        <Card>
          {title && <Card.Title title={title} />}
          <Card.Actions>
            <ScrollView
              contentContainerStyle={{
                flexWrap: "wrap",
                flexDirection: "row",
                justifyContent: "space-evenly",
              }}
            >
              {allFaces.map((f) => (
                <BaseButton
                  key={f}
                  onPress={() => onFaceSelect?.(f)}
                  borderWidth={f === face ? 2 : undefined}
                  borderColor={theme.colors.primary}
                  alignItems="center"
                  m={5}
                >
                  {f}
                </BaseButton>
              ))}
            </ScrollView>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

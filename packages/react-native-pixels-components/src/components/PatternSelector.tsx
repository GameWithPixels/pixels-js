import { EditPattern } from "@systemic-games/pixels-edit-animation";
import {
  BaseButton,
  BaseFlexProps,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, ScrollView } from "react-native";
import { Card, Modal, ModalProps, Portal } from "react-native-paper";

import { PatternCard } from "./PatternCard";
import { useModalStyle } from "../theme";

/**
 * Props for PatternSelector component.
 */
export interface PatternSelectorProps extends BaseFlexProps {
  patterns: Readonly<EditPattern>[];
  pattern?: Readonly<EditPattern>;
  onPatternSelect?: (pattern: Readonly<EditPattern>) => void;
  trigger?: React.ReactNode;
  modalTitle?: string;
  dieRenderer?: (pattern: Readonly<EditPattern>) => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
}

/**
 * Actionsheet drawer of patterns to be opened to display a vertical scroll view of pressables and selectables pattern cards.
 * @param props See {@link PatternSelectorProps} for props parameters.
 */
export function PatternSelector({
  patterns,
  pattern,
  onPatternSelect,
  trigger,
  modalTitle,
  dieRenderer,
  dieViewSize,
  ...flexProps
}: PatternSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const choosePattern = React.useCallback(
    (pattern: Readonly<EditPattern>) => {
      onPatternSelect?.(pattern);
      onClose();
    },
    [onClose, onPatternSelect]
  );
  return (
    <>
      <BaseButton onPress={onOpen} {...flexProps}>
        {trigger ?? pattern?.name ?? "No design selected"}
      </BaseButton>

      <SelectPatternModal
        visible={isOpen}
        onDismiss={onClose}
        patterns={patterns}
        pattern={pattern}
        onPatternSelect={choosePattern}
        title={modalTitle}
        dieRenderer={dieRenderer}
        dieViewSize={dieViewSize}
      />
    </>
  );
}

interface SelectPatternModalProps
  extends Pick<
      PatternSelectorProps,
      "patterns" | "pattern" | "onPatternSelect" | "dieRenderer" | "dieViewSize"
    >,
    Omit<ModalProps, "children"> {
  title?: string;
}

function SelectPatternModal({
  onDismiss,
  patterns,
  pattern,
  onPatternSelect,
  title,
  dieRenderer,
  dieViewSize,
  ...props
}: SelectPatternModalProps) {
  const modalStyle = useModalStyle();
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
              {patterns?.map((p) => (
                <PatternCard
                  key={p.uuid}
                  name={p.name}
                  smallLabel
                  dieRenderer={dieRenderer && (() => dieRenderer(p))}
                  dieViewSize={dieViewSize}
                  onPress={() => onPatternSelect?.(p)}
                  highlighted={p === pattern}
                />
              ))}
            </ScrollView>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

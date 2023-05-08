import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  FastBoxProps,
  FastButton,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, ScrollView } from "react-native";
import { Card, Modal, ModalProps, Portal, Text } from "react-native-paper";
import { useModalStyle } from "../theme";

import { PatternCard } from "./PatternCard";

/**
 * Props for AnimationsSelector component.
 */
export interface AnimationSelectorProps extends FastBoxProps {
  animations: Readonly<EditAnimation>[];
  animation?: Readonly<EditAnimation>;
  onAnimationSelect?: (editAnimation: Readonly<EditAnimation>) => void;
  trigger?: React.ReactNode;
  modalTitle?: string;
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
}

/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link AnimationSelectorProps} for props parameters.
 */
export function AnimationSelector({
  animations,
  animation,
  onAnimationSelect,
  trigger,
  modalTitle,
  dieRenderer,
  dieViewSize,
  ...flexProps
}: AnimationSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const chooseAnimation = React.useCallback(
    (pattern: Readonly<EditAnimation>) => {
      onAnimationSelect?.(pattern);
      onClose();
    },
    [onAnimationSelect, onClose]
  );
  return (
    <>
      <FastButton onPress={onOpen} {...flexProps}>
        {trigger ?? <Text>{animation?.name ?? "No animation selected"}</Text>}
      </FastButton>

      <AnimationsActionsheet
        visible={isOpen}
        onDismiss={onClose}
        animations={animations}
        animation={animation}
        onAnimationSelect={chooseAnimation}
        title={modalTitle}
        dieRenderer={dieRenderer}
        dieViewSize={dieViewSize}
      />
    </>
  );
}

interface AnimationsActionsheetProps
  extends Pick<
      AnimationSelectorProps,
      | "animations"
      | "animation"
      | "onAnimationSelect"
      | "dieRenderer"
      | "dieViewSize"
    >,
    Omit<ModalProps, "children"> {
  title?: string;
}

function AnimationsActionsheet({
  onDismiss,
  animations,
  animation,
  onAnimationSelect,
  title,
  dieRenderer,
  dieViewSize,
  ...props
}: AnimationsActionsheetProps) {
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
              {animations?.map((a) => (
                <PatternCard
                  key={a.uuid}
                  name={a.name}
                  smallLabel
                  dieRenderer={dieRenderer && (() => dieRenderer(a))}
                  dieViewSize={dieViewSize}
                  onPress={() => onAnimationSelect?.(a)}
                  highlighted={a === animation}
                />
              ))}
            </ScrollView>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

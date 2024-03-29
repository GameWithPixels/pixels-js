import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  BaseBoxProps,
  BaseButton,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, ScrollView } from "react-native";
import { Card, Modal, ModalProps, Portal, Text } from "react-native-paper";

import { PatternCard } from "./PatternCard";
import { useModalStyle } from "../theme";

/**
 * Props for AnimationsSelector component.
 */
export interface AnimationSelectorProps extends BaseBoxProps {
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
  const { visible, show, hide } = useVisibility();
  const chooseAnimation = React.useCallback(
    (pattern: Readonly<EditAnimation>) => {
      onAnimationSelect?.(pattern);
      hide();
    },
    [onAnimationSelect, hide]
  );
  return (
    <>
      <BaseButton onPress={show} {...flexProps}>
        {trigger ?? <Text>{animation?.name ?? "No animation selected"}</Text>}
      </BaseButton>

      <AnimationsActionsheet
        visible={visible}
        onDismiss={hide}
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

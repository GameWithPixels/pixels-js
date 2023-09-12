import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  BaseButton,
  FrameProps,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, ScrollView } from "react-native";
import { Card, Modal, ModalProps, Portal } from "react-native-paper";

import { ProfileCard } from "./ProfileCard";
import { useModalStyle } from "../theme";

/**
 * Props for ProfileSelector component.
 */
export interface ProfileSelectorProps extends FrameProps {
  profiles: Readonly<EditProfile>[]; // array of profiles information to be displayed inside the component
  profile?: Readonly<EditProfile>;
  onProfileSelect?: (pattern: Readonly<EditProfile>) => void;
  trigger?: React.ReactNode;
  modalTitle?: string;
  dieRenderer?: (profile: Readonly<EditProfile>) => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
}

/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link ProfileSelectorProps} for props parameters.
 */
export function ProfileSelector({
  profiles,
  trigger,
  profile,
  onProfileSelect,
  modalTitle,
  dieRenderer,
  dieViewSize,
  ...flexProps
}: ProfileSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const chooseProfile = React.useCallback(
    (pattern: Readonly<EditProfile>) => {
      onProfileSelect?.(pattern);
      onClose();
    },
    [onClose, onProfileSelect]
  );
  return (
    <>
      <BaseButton onPress={onOpen} {...flexProps}>
        {trigger ?? profile?.name ?? "No profile selected"}
      </BaseButton>

      <SelectProfileModal
        visible={isOpen}
        onDismiss={onClose}
        profiles={profiles}
        profile={profile}
        onProfileSelect={chooseProfile}
        title={modalTitle}
        dieRenderer={dieRenderer}
        dieViewSize={dieViewSize}
      />
    </>
  );
}

export interface SelectProfileModalProps
  extends Pick<
      ProfileSelectorProps,
      "profiles" | "profile" | "onProfileSelect" | "dieRenderer" | "dieViewSize"
    >,
    Omit<ModalProps, "children"> {
  title?: string;
}

export function SelectProfileModal({
  onDismiss,
  profiles,
  profile,
  onProfileSelect,
  title,
  dieRenderer,
  dieViewSize,
  ...props
}: SelectProfileModalProps) {
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
              {profiles?.map((p) => (
                <ProfileCard
                  key={p.uuid}
                  name={p.name}
                  smallLabel
                  dieRenderer={dieRenderer && (() => dieRenderer(p))}
                  dieViewSize={dieViewSize}
                  onPress={() => onProfileSelect?.(p)}
                  highlighted={p === profile}
                />
              ))}
            </ScrollView>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

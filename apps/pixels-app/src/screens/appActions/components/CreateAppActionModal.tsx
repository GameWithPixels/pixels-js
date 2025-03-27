import React from "react";
import { View } from "react-native";
import { Modal, Portal, Text } from "react-native-paper";

import { AppStyles } from "~/app/styles";
import { GradientBorderCard } from "~/components/GradientBorderCard";
import { GradientIconButton } from "~/components/buttons";
import { AppActionTypeIcon } from "~/components/icons";
import { AppActionType } from "~/features/store";

const appActionKinds: readonly AppActionType[] = [
  "speak",
  "url",
  "json",
  "discord",
  "twitch",
  "dddice",
  "proxy",
] as const;

function NewAppActionButtons({
  onPress,
}: {
  onPress?: (format: AppActionType) => void;
}) {
  return (
    onPress && (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
          justifyContent: "center",
          gap: 30,
        }}
      >
        {appActionKinds.map((kind) => (
          <View key={kind} style={{ width: 50, alignItems: "center", gap: 5 }}>
            <GradientIconButton
              size={50}
              icon={(props) => (
                <AppActionTypeIcon appActionType={kind} {...props} />
              )}
              onPress={() => onPress?.(kind)}
            />
            <Text variant="bodySmall">{kind}</Text>
          </View>
        ))}
      </View>
    )
  );
}

export function CreateAppActionModal({
  visible,
  onCreateAppAction,
  onDismiss,
}: {
  visible: boolean;
  onCreateAppAction: (type: AppActionType) => void;
  onDismiss?: () => void;
}) {
  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={!!onDismiss}
        onDismiss={onDismiss}
        style={{ marginHorizontal: 20 }}
      >
        <GradientBorderCard
          contentStyle={{
            paddingVertical: 30,
            paddingHorizontal: 10,
            gap: 30,
          }}
        >
          <Text variant="titleLarge" style={AppStyles.selfCentered}>
            Type Of Action To Create
          </Text>
          <NewAppActionButtons
            onPress={(actionType) => onCreateAppAction(actionType)}
          />
        </GradientBorderCard>
      </Modal>
    </Portal>
  );
}

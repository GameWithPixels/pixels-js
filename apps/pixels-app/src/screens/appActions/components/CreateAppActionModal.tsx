import React from "react";
import { View } from "react-native";
import {
  Modal,
  Portal,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import { AppStyles } from "~/app/styles";
import { GradientBorderCard } from "~/components/GradientBorderCard";
import { TopRightCloseButton } from "~/components/buttons";
import { AppActionTypeIcon } from "~/components/icons";
import { getBorderRadius } from "~/features/getBorderRadius";
import { AppActionType } from "~/features/store";

const appActionKinds: readonly AppActionType[] = [
  "speak",
  "url",
  "json",
  "discord",
  "dddice",
  // "twitch",
  // "proxy",
] as const;

function NewAppActionButtons({
  onPress,
}: {
  onPress?: (format: AppActionType) => void;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
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
          <GradientBorderCard key={kind}>
            <TouchableRipple
              rippleColor={colors.onPrimary}
              borderless
              style={{
                width: 60,
                margin: -5,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                aspectRatio: 1,
                borderRadius,
              }}
              onPress={() => onPress?.(kind)}
            >
              <>
                <AppActionTypeIcon
                  appActionType={kind}
                  size={28}
                  color={colors.onSurface}
                />
                <Text variant="bodySmall">{kind}</Text>
              </>
            </TouchableRipple>
          </GradientBorderCard>
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
            Select an App Action Type
          </Text>
          <NewAppActionButtons
            onPress={(actionType) => onCreateAppAction(actionType)}
          />
          <TopRightCloseButton top={-5} onPress={onDismiss} />
        </GradientBorderCard>
      </Modal>
    </Portal>
  );
}

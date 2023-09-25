import {
  BaseBox,
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  UserMessageEvent,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextProps,
  useTheme,
} from "react-native-paper";

import { PixelInfoCard, PixelInfoCardProps } from "./PixelInfoCard";
import { ProgressBar } from "./ProgressBar";

import { AppStyles } from "~/AppStyles";
import { isDfuDone } from "~/features/dfu/updateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";

function UserMessageDialog({
  title,
  message,
  visible,
  onClose,
  onPressOk: onOk,
  onPressCancel: onCancel,
}: {
  title: string;
  message?: string;
  visible: boolean;
  onClose: () => void;
  onPressOk?: () => void;
  onPressCancel?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        dismissable={!onOk && !onCancel}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <>
            {onCancel && (
              <Button
                onPress={() => {
                  onCancel?.();
                  onClose();
                }}
              >
                {t("cancel")}
              </Button>
            )}
            {onOk && (
              <Button
                onPress={() => {
                  onOk?.();
                  onClose();
                }}
              >
                {t("ok")}
              </Button>
            )}
          </>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function SwipeableActionView({
  label,
  textStyle,
  ...props
}: BaseBoxProps & {
  label: string;
  textStyle: TextProps<string>["style"];
}) {
  return (
    <BaseBox alignItems="center" justifyContent="center" {...props}>
      <Text style={textStyle}>{label}</Text>
    </BaseBox>
  );
}

function PixelCard({
  children,
  pixelDispatcher,
  ...props
}: Omit<SwipeablePixelCardProps, "scannedPixel" | "onShowDetails"> & {
  pixelDispatcher: PixelDispatcher;
}) {
  const [lastError, setLastError] = React.useState<Error>();
  const clearError = React.useCallback(() => setLastError(undefined), []);

  // Pixel status
  const status = usePixelStatus(pixelDispatcher.pixel);

  // Monitor RSSI once connected
  React.useEffect(() => {
    if (pixelDispatcher && status === "ready") {
      pixelDispatcher.dispatch("reportRssi");
    }
  }, [pixelDispatcher, status]);

  // Pixel Dispatcher states
  const [lastActivitySec, setLastActivitySec] = React.useState(
    Math.floor(pixelDispatcher.durationSinceLastActivity / 1000)
  );
  const [profileUpload, setProfileUpload] = React.useState<number>();
  const [dfuActive, setDfuActive] = React.useState(
    pixelDispatcher.hasActiveDFU
  );
  const [dfuQueued, setDfuQueued] = React.useState(
    pixelDispatcher.hasQueuedDFU
  );
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState<number>(0);

  // Reset DFU state and progress when aborted or completed
  React.useEffect(() => {
    if (dfuState && isDfuDone(dfuState)) {
      setDfuState(undefined);
      setDfuProgress(0);
    }
  }, [dfuState]);

  // Subscribe to events for which we store the resulting state
  React.useEffect(() => {
    const add = pixelDispatcher.addEventListener.bind(pixelDispatcher);
    add("error", setLastError);
    const setLastActivity = (ms: number) =>
      setLastActivitySec(Math.floor(ms / 1000));
    add("durationSinceLastActivity", setLastActivity);
    add("profileUploadProgress", setProfileUpload);
    add("hasActiveDFU", setDfuActive);
    add("hasQueuedDFU", setDfuQueued);
    add("dfuState", setDfuState);
    add("dfuProgress", setDfuProgress);
    const notifyUserListener = ({
      message,
      withCancel,
      response,
    }: UserMessageEvent) => {
      setNotifyUserData({
        message,
        onOk: () => response(true),
        onCancel: withCancel ? () => response(false) : undefined,
      });
    };
    pixelDispatcher.pixel.addEventListener("userMessage", notifyUserListener);
    return () => {
      const remove = pixelDispatcher.removeEventListener.bind(pixelDispatcher);
      remove("error", setLastError);
      remove("durationSinceLastActivity", setLastActivity);
      remove("profileUploadProgress", setProfileUpload);
      remove("hasActiveDFU", setDfuActive);
      remove("hasQueuedDFU", setDfuQueued);
      remove("dfuState", setDfuState);
      remove("dfuProgress", setDfuProgress);
      pixelDispatcher.pixel.removeEventListener(
        "userMessage",
        notifyUserListener
      );
    };
  }, [pixelDispatcher]);

  // User notification
  const [notifyUserData, setNotifyUserData] = React.useState<{
    message: string;
    onOk?: () => void;
    onCancel?: () => void;
    handled?: boolean;
  }>();
  const {
    visible: notifyVisible,
    show: showNotify,
    hide: hideNotify,
  } = useVisibility();
  React.useEffect(() => {
    if (notifyUserData && !notifyUserData.handled) {
      setNotifyUserData({ ...notifyUserData, handled: true });
      showNotify();
    }
  }, [notifyUserData, showNotify]);

  // Values for UI
  const { t } = useTranslation();
  const isDisco = !status || status === "disconnected";
  const statusStr = t(
    !status || (isDisco && lastActivitySec < 5000) ? "advertising" : status
  );
  const theme = useTheme();
  return (
    <>
      <PixelInfoCard pixelInfo={pixelDispatcher.asNotifier()} {...props}>
        <BaseVStack gap={3} alignItems="center" width="100%">
          {/* Show either DFU progress, profile update progress, connect state or advertising state */}
          {dfuQueued ? (
            <Text>{t("waitingOnFirmwareUpdate")}</Text>
          ) : // DFU status and progress
          dfuActive ? (
            <BaseHStack
              width="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Text>{t("firmwareUpdate")}: </Text>
              {dfuState === "uploading" ? (
                <View style={AppStyles.flex}>
                  <ProgressBar percent={dfuProgress} />
                </View>
              ) : (
                dfuState && <Text style={AppStyles.italic}>{t(dfuState)}</Text>
              )}
            </BaseHStack>
          ) : profileUpload ? (
            // Profile update progress
            <BaseHStack
              width="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Text>Profile Update: </Text>
              <View style={AppStyles.flex}>
                <ProgressBar percent={profileUpload} />
              </View>
            </BaseHStack>
          ) : isDisco && lastActivitySec >= 5 ? (
            // Pixel is disconnected and hasn't been seen for a while (no advertising)
            <Text style={AppStyles.italic}>{`${t("unavailable")} (${
              lastActivitySec < 120
                ? t("secondsWithValue", {
                    value: lastActivitySec,
                  })
                : t("minutesWithValue", {
                    value: Math.floor(lastActivitySec / 60),
                  })
            })`}</Text>
          ) : (
            // Pixel is either connecting/connected or advertising
            <Text>
              <Text>{t("status")}: </Text>
              <Text style={AppStyles.italic}>{statusStr}</Text>
            </Text>
          )}
          {children}
          {lastError && (
            <>
              <Text style={{ color: theme.colors.error }}>
                {lastError?.message}
              </Text>
              <Button mode="outlined" onPress={clearError}>
                {t("clearError")}
              </Button>
            </>
          )}
        </BaseVStack>
      </PixelInfoCard>

      <UserMessageDialog
        title={pixelDispatcher.name}
        message={notifyUserData?.message}
        visible={notifyVisible}
        onClose={hideNotify}
        onPressOk={
          notifyUserData?.onOk ? () => notifyUserData.onOk?.() : undefined
        }
        onPressCancel={
          notifyUserData?.onCancel
            ? () => notifyUserData.onCancel?.()
            : undefined
        }
      />
    </>
  );
}

export interface SwipeablePixelCardProps
  extends Omit<PixelInfoCardProps, "pixelInfo"> {
  pixelDispatcher: PixelDispatcher;
  onShowDetails: () => void;
}

export function PixelSwipeableCard({
  pixelDispatcher,
  onShowDetails,
  ...props
}: SwipeablePixelCardProps) {
  const status = usePixelStatus(pixelDispatcher.pixel);

  // Pixel Dispatcher states
  const [dfuAvailable, setDfuAvailable] = React.useState(
    pixelDispatcher.hasAvailableDFU
  );
  const [dfuQueued, setDfuQueued] = React.useState(
    pixelDispatcher.hasQueuedDFU
  );
  const [dfuActive, setDfuActive] = React.useState(
    pixelDispatcher.hasActiveDFU
  );
  React.useEffect(() => {
    pixelDispatcher.addEventListener("hasAvailableDFU", setDfuAvailable);
    pixelDispatcher.addEventListener("hasActiveDFU", setDfuActive);
    pixelDispatcher.addEventListener("hasQueuedDFU", setDfuQueued);
    return () => {
      pixelDispatcher.removeEventListener("hasAvailableDFU", setDfuAvailable);
      pixelDispatcher.removeEventListener("hasActiveDFU", setDfuActive);
      pixelDispatcher.removeEventListener("hasQueuedDFU", setDfuQueued);
    };
  }, [pixelDispatcher]);

  // Values for UI
  const { t } = useTranslation();
  const isDisco = !status || status === "disconnected";

  // Swipeable
  const onSwipeableOpen = React.useCallback(
    (direction: "left" | "right", swipeable: Swipeable) => {
      if (direction === "left") {
        if (!dfuQueued) {
          if (isDisco) {
            pixelDispatcher.dispatch("connect");
          } else {
            pixelDispatcher.dispatch("disconnect");
          }
        }
      } else {
        if (isDisco) {
          if (dfuQueued) {
            pixelDispatcher.dispatch("dequeueDFU");
          } else {
            pixelDispatcher.dispatch("queueDFU");
          }
        } else {
          pixelDispatcher.dispatch("blink");
        }
      }
      swipeable.close();
    },
    [dfuQueued, isDisco, pixelDispatcher]
  );
  const renderLeftActions = React.useCallback(
    () =>
      !dfuQueued && (
        <SwipeableActionView
          w={150}
          backgroundColor={isDisco ? "limegreen" : "tomato"}
          label={t(isDisco ? "connect" : "disconnect")}
          textStyle={styles.textSwipe}
        />
      ),
    [dfuQueued, isDisco, t]
  );
  const renderRightActions = React.useCallback(
    () =>
      (!isDisco || (dfuAvailable && !dfuActive)) && (
        <SwipeableActionView
          w={150}
          backgroundColor={isDisco ? "mediumpurple" : "darkorange"}
          label={
            isDisco
              ? dfuActive
                ? ""
                : dfuQueued
                ? t("cancelFirmwareUpdate")
                : t("updateFirmware").replace(" ", "\n")
              : t("blink")
          }
          textStyle={styles.textSwipe}
        />
      ),
    [isDisco, dfuAvailable, dfuActive, dfuQueued, t]
  );

  return (
    <Swipeable
      onSwipeableOpen={onSwipeableOpen}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable onPress={() => onShowDetails()}>
        <PixelCard pixelDispatcher={pixelDispatcher} {...props} />
        {dfuAvailable && <Text style={styles.topRightCorner}>⬆️</Text>}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  topRightCorner: {
    position: "absolute",
    top: 1,
    right: 2,
  },
  textSwipe: {
    marginHorizontal: 5,
    color: "floralwhite",
    fontWeight: "bold",
  },
});

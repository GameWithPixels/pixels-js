import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  UserMessageEvent,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable, {
  type SwipeableProps,
} from "react-native-gesture-handler/Swipeable";
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper";

import { PixelInfoCard, PixelInfoCardProps } from "./PixelInfoCard";
import { ProgressBar } from "./ProgressBar";

import { AppStyles } from "~/AppStyles";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { isDfuDone } from "~/features/dfu/updateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { useVisibility } from "~/features/useVisibility";

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
  const { colors } = useTheme();
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
              <Text style={{ color: colors.error }}>{lastError?.message}</Text>
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

function RenderRightItem({
  label,
  color,
  position,
  width,
  progress,
  onPress,
}: {
  label: string;
  color: string;
  position: number;
  width: number;
  progress: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  const trans = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [position, 0],
    extrapolate: "extend",
  });
  return (
    <Animated.View
      style={{
        width,
        transform: [{ translateX: trans }],
        backgroundColor: color,
      }}
    >
      <RectButton
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={onPress}
      >
        <Text variant="labelLarge" style={{ fontWeight: "bold" }}>
          {label.replace(" ", "\n")}
        </Text>
      </RectButton>
    </Animated.View>
  );
}

export interface SwipeablePixelCardProps
  extends Omit<PixelInfoCardProps, "pixelInfo"> {
  pixelDispatcher: PixelDispatcher;
  onShowDetails?: (pixelDispatcher: PixelDispatcher) => void;
  onPrintLabel?: (pixelDispatcher: PixelDispatcher) => void;
}

export function PixelSwipeableCard({
  pixelDispatcher,
  onShowDetails,
  onPrintLabel,
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
  const swipeableRef = React.useRef<Swipeable>(null);
  const onSwipeableOpen = React.useCallback(
    (direction: "left" | "right", swipeable: Swipeable) => {
      if (direction === "left") {
        if (isDisco) {
          pixelDispatcher.dispatch("connect");
        } else {
          pixelDispatcher.dispatch("disconnect");
        }
        swipeable.close();
      }
    },
    [isDisco, pixelDispatcher]
  );
  const renderLeftActions = React.useCallback<
    NonNullable<SwipeableProps["renderLeftActions"]>
  >(
    (_, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [0, 50, 100, 101],
        outputRange: [-20, 0, 0, 1],
        extrapolate: "clamp",
      });
      return (
        !dfuActive && (
          <RectButton
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: isDisco ? "#22a11c" : "#c81818",
            }}
          >
            <Animated.Text
              style={{
                color: "white",
                fontSize: 16,
                backgroundColor: "transparent",
                padding: 10,
                transform: [{ translateX: trans }],
              }}
            >
              {t(isDisco ? "connect" : "disconnect")}
            </Animated.Text>
          </RectButton>
        )
      );
    },
    [dfuActive, isDisco, t]
  );
  const renderRightActions = React.useCallback<
    NonNullable<SwipeableProps["renderRightActions"]>
  >(
    (progress) => {
      const buttonWidth = 100;
      const color = isDisco ? "#be19c3" : "#21aba2";
      const label = isDisco
        ? dfuActive
          ? ""
          : dfuQueued
            ? t("cancelFirmwareUpdate")
            : dfuAvailable !== "none"
              ? t("updateFirmware")
              : ""
        : t("blink");
      const numButtons = (label.length ? 1 : 0) + (onPrintLabel ? 1 : 0);
      return (
        !!numButtons && (
          <View
            style={{
              width: numButtons * buttonWidth,
              flexDirection: "row",
            }}
          >
            {!!onPrintLabel && (
              <RenderRightItem
                label={t("printLabel")}
                color="#274fcd"
                position={numButtons * buttonWidth}
                width={buttonWidth}
                progress={progress}
                onPress={() => {
                  onPrintLabel(pixelDispatcher);
                  swipeableRef.current?.close();
                }}
              />
            )}
            {!!label.length && (
              <RenderRightItem
                label={label}
                color={color}
                position={0}
                width={buttonWidth}
                progress={progress}
                onPress={() => {
                  pixelDispatcher.dispatch(
                    isDisco ? (dfuQueued ? "dequeueDFU" : "queueDFU") : "blink"
                  );
                  swipeableRef.current?.close();
                }}
              />
            )}
          </View>
        )
      );
    },
    [
      isDisco,
      dfuActive,
      dfuQueued,
      t,
      dfuAvailable,
      onPrintLabel,
      pixelDispatcher,
    ]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      onSwipeableOpen={onSwipeableOpen}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={
          onShowDetails ? () => onShowDetails(pixelDispatcher) : undefined
        }
      >
        <PixelCard pixelDispatcher={pixelDispatcher} {...props} />
        {dfuAvailable !== "none" && (
          <Text
            // Top right corner
            style={{
              position: "absolute",
              top: 1,
              right: 2,
            }}
          >
            {dfuAvailable === "upgrade" ? "⬆️" : "⬇️"}
          </Text>
        )}
      </Pressable>
    </Swipeable>
  );
}

import {
  FastBox,
  FastBoxProps,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextProps,
  useTheme,
} from "react-native-paper";

import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import gs from "~/styles";

function AlertDialog({
  title,
  message,
  isOpen,
  onClose,
  onPressOk: onOk,
  onPressCancel: onCancel,
}: {
  title: string;
  message?: string;
  isOpen: boolean;
  onClose: () => void;
  onPressOk?: () => void;
  onPressCancel?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Portal>
      <Dialog
        visible={isOpen}
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

function SwipeableItemView({
  backgroundColor,
  label,
  textStyle,
  ...props
}: FastBoxProps & {
  backgroundColor: ViewStyle["backgroundColor"];
  label: string;
  textStyle: TextProps<string>["style"];
}) {
  return (
    <View style={{ backgroundColor }}>
      <FastBox alignItems="center" justifyContent="center" {...props}>
        <Text style={textStyle}>{label}</Text>
      </FastBox>
    </View>
  );
}

function PixelCard({
  children,
  pixelDispatcher,
  dfuQueued,
  setDfuQueued,
  ...props
}: Omit<SwipeablePixelCardProps, "scannedPixel" | "onShowDetails"> & {
  pixelDispatcher: PixelDispatcher;
  dfuQueued: boolean;
  setDfuQueued: (value: boolean) => void;
}) {
  React.useEffect(() => {
    pixelDispatcher.dispatch("reportRssi");
  }, [pixelDispatcher]);

  const [lastError, setLastError] = React.useState<Error>();
  const [profileUpdate, setProfileUpdate] = React.useState<number>();
  const [dfuState, setDfuState] = React.useState<DfuState>("dfuCompleted");
  const [dfuProgress, setDfuProgress] = React.useState<number>(0);

  // Reset DFU state and progress when aborted or completed
  React.useEffect(() => {
    if (dfuState === "dfuAborted") {
      setDfuState("dfuCompleted");
      setDfuProgress(0);
      setLastError(new Error("DFU Aborted"));
    } else if (dfuState === "dfuCompleted") {
      setDfuProgress(0);
    }
  }, [dfuState]);

  // Subscribe to events for which we store the resulting state
  React.useEffect(() => {
    pixelDispatcher.addEventListener("error", setLastError);
    pixelDispatcher.addEventListener("profileUpdateProgress", setProfileUpdate);
    pixelDispatcher.addEventListener("firmwareUpdateQueued", setDfuQueued);
    pixelDispatcher.addEventListener("firmwareUpdateState", setDfuState);
    pixelDispatcher.addEventListener("firmwareUpdateProgress", setDfuProgress);
    const notifyUserListener = ({
      message,
      withCancel,
      response,
    }: {
      message: string;
      withCancel: boolean;
      response: (okCancel: boolean) => void;
    }) => {
      setNotifyUserData({
        message,
        onOk: () => response(true),
        onCancel: withCancel ? () => response(false) : undefined,
      });
    };
    pixelDispatcher.pixel.addEventListener("userMessage", notifyUserListener);
    return () => {
      pixelDispatcher.removeEventListener("error", setLastError);
      pixelDispatcher.removeEventListener(
        "profileUpdateProgress",
        setProfileUpdate
      );
      pixelDispatcher.removeEventListener("firmwareUpdateQueued", setDfuQueued);
      pixelDispatcher.removeEventListener("firmwareUpdateState", setDfuState);
      pixelDispatcher.removeEventListener(
        "firmwareUpdateProgress",
        setDfuProgress
      );
      pixelDispatcher.pixel.removeEventListener(
        "userMessage",
        notifyUserListener
      );
    };
  }, [pixelDispatcher, setDfuQueued]);

  // User notification
  const [notifyUserData, setNotifyUserData] = React.useState<{
    message: string;
    onOk?: () => void;
    onCancel?: () => void;
    handled?: boolean;
  }>();
  const notifyUserDisclose = useDisclose();
  const open = notifyUserDisclose.onOpen;
  React.useEffect(() => {
    if (notifyUserData && !notifyUserData.handled) {
      setNotifyUserData({ ...notifyUserData, handled: true });
      open();
    }
  }, [notifyUserData, open]);

  // Values for UI
  const { t } = useTranslation();
  const isDisco =
    !pixelDispatcher.status || pixelDispatcher.status === "disconnected";
  const lastSeen = Math.round(
    (Date.now() - pixelDispatcher.lastBleActivity.getTime()) / 1000
  );
  const theme = useTheme();
  return (
    <>
      <PixelInfoCard pixelInfo={pixelDispatcher} {...props}>
        {pixelDispatcher.canUpdateFirmware && (
          <Text style={styles.topRightCorner}>⬆️</Text>
        )}
        <FastVStack gap={3} alignItems="center" width="100%">
          {/* Show either DFU progress, profile update progress, connect state or advertising state */}
          {dfuQueued ? (
            // DFU status and progress
            dfuState !== "dfuCompleted" ? (
              <FastHStack
                width="100%"
                alignItems="center"
                justifyContent="center"
              >
                <Text>{t("firmwareUpdate")}: </Text>
                {dfuState === "dfuStarting" && dfuProgress > 0 ? (
                  <View style={gs.flex}>
                    <ProgressBar percent={dfuProgress} />
                  </View>
                ) : (
                  <Text style={gs.italic}>{t(dfuState)}</Text>
                )}
              </FastHStack>
            ) : (
              <Text>{t("waitingOnFirmwareUpdate")}</Text>
            )
          ) : profileUpdate ? (
            // Profile update progress
            <FastHStack
              width="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Text>Profile Update: </Text>
              <View style={gs.flex}>
                <ProgressBar percent={profileUpdate} />
              </View>
            </FastHStack>
          ) : isDisco && lastSeen > 5 ? (
            // Pixel is disconnected and hasn't been seen for a while (no advertising)
            <Text style={gs.italic}>{`${t("unavailable")} (${
              lastSeen < 120
                ? t("secondsWithValue", { value: lastSeen })
                : t("minutesWithValue", {
                    value: Math.floor(lastSeen / 60),
                  })
            })`}</Text>
          ) : (
            // Pixel is either connecting/connected or advertising
            <Text>
              <Text>{t("status")}: </Text>
              <Text style={gs.italic}>
                {t(
                  isDisco && lastSeen <= 5
                    ? "advertising"
                    : pixelDispatcher.status
                )}
              </Text>
            </Text>
          )}
          {children}
          {lastError && (
            <>
              <Text style={{ color: theme.colors.error }}>
                {lastError?.message}
              </Text>
              <Button mode="outlined" onPress={() => setLastError(undefined)}>
                {t("clearError")}
              </Button>
            </>
          )}
        </FastVStack>
      </PixelInfoCard>

      <AlertDialog
        title={pixelDispatcher.name}
        message={notifyUserData?.message}
        isOpen={notifyUserDisclose.isOpen}
        onClose={notifyUserDisclose.onClose}
      />
    </>
  );
}

export interface SwipeablePixelCardProps
  extends Omit<PixelInfoCardProps, "pixelInfo"> {
  scannedPixel: ScannedPixelNotifier;
  onShowDetails: () => void;
}

export function PixelSwipeableCard({
  scannedPixel,
  onShowDetails,
  ...props
}: SwipeablePixelCardProps) {
  const pixelDispatcher = PixelDispatcher.getInstance(scannedPixel);
  const [dfuQueued, setDfuQueued] = React.useState(false);

  // Values for UI
  const { t } = useTranslation();
  const isDisco =
    !pixelDispatcher.status || pixelDispatcher.status === "disconnected";
  // TODO watch those states
  const canUpdateFirmware = pixelDispatcher.canUpdateFirmware;
  const isFirmwareUpdateQueued = pixelDispatcher.isFirmwareUpdateQueued;
  const isUpdatingFirmware = pixelDispatcher.isUpdatingFirmware;

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
          if (isFirmwareUpdateQueued) {
            pixelDispatcher.dispatch("dequeueFirmwareUpdate");
          } else {
            pixelDispatcher.dispatch("queueFirmwareUpdate");
          }
        } else {
          pixelDispatcher.dispatch("blink");
        }
      }
      swipeable.close();
    },
    [dfuQueued, isDisco, isFirmwareUpdateQueued, pixelDispatcher]
  );
  const renderLeftActions = React.useCallback(
    () =>
      !dfuQueued && (
        <SwipeableItemView
          px={1}
          label={t(isDisco ? "connect" : "disconnect")}
          backgroundColor={isDisco ? "green.500" : "red.500"}
          textStyle={styles.textSwipe}
        />
      ),
    [dfuQueued, isDisco, t]
  );
  const renderRightActions = React.useCallback(
    () =>
      (!isDisco || (canUpdateFirmware && !isUpdatingFirmware)) && (
        <SwipeableItemView
          px={1}
          label={
            isDisco
              ? isUpdatingFirmware
                ? ""
                : isFirmwareUpdateQueued
                ? t("cancelFirmwareUpdate")
                : t("updateFirmware").replace(" ", "\n")
              : t("blink")
          }
          backgroundColor={isDisco ? "purple.500" : "orange.500"}
          textStyle={styles.textSwipe}
        />
      ),
    [canUpdateFirmware, isDisco, isFirmwareUpdateQueued, isUpdatingFirmware, t]
  );

  return (
    <>
      <Swipeable
        onSwipeableOpen={onSwipeableOpen}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
      >
        <Pressable onPress={() => onShowDetails()}>
          <PixelCard
            pixelDispatcher={pixelDispatcher}
            dfuQueued={dfuQueued}
            setDfuQueued={setDfuQueued}
            {...props}
          />
        </Pressable>
      </Swipeable>
    </>
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
    color: "gray",
    fontWeight: "bold",
  },
});

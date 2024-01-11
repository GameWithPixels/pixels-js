import {
  Pixel,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import {
  Pressable,
  useWindowDimensions,
  TextInput as RNTextInput,
  View,
  ViewProps,
} from "react-native";
import { Badge, Text, TextInput, useTheme } from "react-native-paper";

import { DieMenu } from "./DieMenu";
import { PickProfileBottomSheet } from "./PickProfileBottomSheet";
import { PixelRollCard } from "./PixelRollCard";
import { PixelStatusCard } from "./PixelStatusCard";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { NewPixelAppBanner } from "~/components/banners";
import { PixelDieRenderer } from "~/components/cards";
import { makeTransparent } from "~/components/colors";
import { ProfileCard, ProfileCardProps } from "~/components/profile";
import { blinkDie, transferProfile } from "~/features/dice";
import { FactoryProfile, getPixelStatusLabel } from "~/features/profiles";
import { setShowNewPixelsAppBanner } from "~/features/store/appSettingsSlice";
import {
  useActiveProfile,
  useConfirmActionSheet,
  useHasFirmwareUpdate,
} from "~/hooks";

const PixelNameTextInput = React.forwardRef(function PixelNameTextInput(
  {
    pixel,
    onEndEditing,
  }: { pixel: Pixel; onEndEditing: (name: string) => void },
  ref: React.ForwardedRef<RNTextInput>
) {
  const [name, setName] = React.useState(pixel.name);
  return (
    <TextInput
      ref={ref}
      mode="flat"
      dense
      autoFocus
      maxLength={15}
      style={{
        marginHorizontal: 60,
        textAlign: "center",
      }}
      value={name}
      onChangeText={setName}
      onEndEditing={() => onEndEditing(name)}
    />
  );
});

export function PixelFocusViewHeader({
  pixel,
  onUnpair,
  onFirmwareUpdate,
}: {
  pixel: Pixel;
  onUnpair: () => void;
  onFirmwareUpdate: () => void;
}) {
  const status = usePixelStatus(pixel);
  const [pixelName] = usePixelValue(pixel, "name");
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  const disabled = status !== "ready";
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const showConfirmReset = useConfirmActionSheet("Reset Die Settings", () => {
    pixel.sendMessage("clearSettings");
  });
  const showConfirmTurnOff = useConfirmActionSheet(
    "Turn Die Off",
    () => {
      pixel.turnOff();
    },
    {
      message:
        "Reminder: your die will stay off until placed back in its case with the lid closed.Alternatively you can turn it back on by holding a magnet to its upper face.",
    }
  );
  const [renameVisible, setRenameVisible] = React.useState(false);
  const textInputRef = React.useRef<RNTextInput>(null);
  React.useEffect(() => {
    if (renameVisible && textInputRef.current) {
      textInputRef.current?.focus();
    }
  }, [renameVisible]);
  const { width: windowWidth } = useWindowDimensions();
  const { colors, fonts } = useTheme();
  const color = actionsMenuVisible
    ? colors.onSurfaceDisabled
    : colors.onSurface;
  return (
    <View>
      {!pixel ? (
        <View style={{ height: 10 + fonts.titleLarge.lineHeight }} />
      ) : !renameVisible ? (
        <Pressable
          sentry-label="actions-menu"
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
          onPress={() => setActionsMenuVisible(true)}
        >
          <Text
            variant="titleLarge"
            style={{
              paddingTop: 10,
              paddingHorizontal: 5,
              color,
            }}
          >
            {disabled ? getPixelStatusLabel(status) : pixelName}
          </Text>
          {!!pixel && (
            <>
              <ChevronDownIcon
                size={18}
                color={color}
                backgroundColor={makeTransparent(colors.onBackground, 0.2)}
                style={{ marginBottom: 3 }}
              />
              <DieMenu
                visible={actionsMenuVisible}
                anchor={{ x: (windowWidth - 230) / 2, y: 80 }}
                disconnected={disabled}
                onDismiss={() => setActionsMenuVisible(false)}
                onUnpair={onUnpair}
                onUpdateFirmware={
                  hasFirmwareUpdate ? onFirmwareUpdate : undefined
                }
                onRename={() => setRenameVisible(true)}
                onReset={() => showConfirmReset()}
                onTurnOff={() => showConfirmTurnOff()}
              />
              {hasFirmwareUpdate ? (
                <Badge style={{ position: "absolute", right: -15, top: 5 }}>
                  !
                </Badge>
              ) : null}
            </>
          )}
        </Pressable>
      ) : (
        <PixelNameTextInput
          pixel={pixel}
          onEndEditing={(name) => {
            pixel.rename(name);
            setRenameVisible(false);
          }}
        />
      )}
    </View>
  );
}

function RollingDie({ pixel, disabled }: { pixel: Pixel; disabled: boolean }) {
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return (
    <PixelDieRenderer pixel={pixel} speed={disabled ? 0 : rolling ? 10 : 1} />
  );
}

function PixelProfile({ ...props }: Omit<ProfileCardProps, "row">) {
  const { colors } = useTheme();
  const description = FactoryProfile.isFactory(props.profile.uuid)
    ? "Your die is configured with the factory Profile."
    : undefined;
  return (
    <View>
      <ProfileCard row description={description} {...props} />
      <Text
        variant="labelSmall"
        style={{
          position: "absolute",
          right: 10,
          bottom: 0,
          color: colors.onSurfaceDisabled,
        }}
      >
        Tap to switch Profile
      </Text>
    </View>
  );
}

export function PixelFocusView({
  pixel,
  onEditProfile,
  onShowDetails,
  style,
  ...props
}: {
  pixel: Pixel;
  onEditProfile: () => void;
  onShowDetails: () => void;
} & Omit<ViewProps, "children">) {
  const appDispatch = useAppDispatch();

  const status = usePixelStatus(pixel);
  React.useEffect(() => {
    // Blink when die is selected
    blinkDie(pixel);
  }, [pixel]);
  const activeProfile = useActiveProfile(pixel);
  const transferring = useAppSelector((state) => !!state.diceRolls.transfer);
  const [pickProfile, setPickProfile] = React.useState(false);

  const showNewPixelsAppBanner = useAppSelector(
    (state) => state.appSettings.showNewPixelsAppBanner
  );

  const disabled = status !== "ready";
  return (
    <>
      <View {...props} style={[{ gap: 10 }, style]}>
        <NewPixelAppBanner
          visible={showNewPixelsAppBanner}
          collapsedMarginBottom={-10}
          onHide={() => appDispatch(setShowNewPixelsAppBanner(false))}
        />
        <Pressable
          sentry-label="header-bar-select"
          style={{
            width: "60%",
            aspectRatio: 1,
            alignSelf: "center",
          }}
          onPress={() => blinkDie(pixel)}
        >
          <RollingDie pixel={pixel} disabled={disabled} />
        </Pressable>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            marginTop: 10,
            gap: 10,
          }}
        >
          <PixelRollCard
            pixel={pixel}
            disabled={disabled}
            style={{ flex: 1, flexGrow: 1 }}
          />
          <PixelStatusCard
            pixel={pixel}
            disabled={disabled}
            onPress={onShowDetails}
            style={{ flex: 1, flexGrow: 1 }}
          />
        </View>
        <Text variant="titleMedium">Active Profile</Text>
        <PixelProfile
          profile={activeProfile}
          transferring={transferring}
          onPress={() => setPickProfile(true)}
        />
        <Text variant="titleMedium">Available Dice</Text>
      </View>
      <PickProfileBottomSheet
        pixel={pixel}
        profile={activeProfile}
        onSelectProfile={(profile) => {
          if (!transferring) {
            setPickProfile(false);
            transferProfile(pixel, profile);
          } else {
            console.log(
              "Dropping profile transfer because one is already in progress"
            );
          }
        }}
        visible={pickProfile}
        onDismiss={() => setPickProfile(false)}
      />
    </>
  );
}

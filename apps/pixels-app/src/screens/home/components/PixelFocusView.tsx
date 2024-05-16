import { MaterialCommunityIcons } from "@expo/vector-icons";
import { encodeUtf8 } from "@systemic-games/pixels-core-utils";
import {
  Constants,
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
import { Text, TextInput, TouchableRipple, useTheme } from "react-native-paper";

import { DieMenu } from "./DieMenu";
import { PickProfileBottomSheet } from "./PickProfileBottomSheet";
import { PixelRollsCard } from "./PixelRollsCard";
import { PixelStatusCard } from "./PixelStatusCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PixelDieRenderer } from "~/components/DieRenderer";
import { FirmwareUpdateBadge } from "~/components/FirmwareUpdateBadge";
import { SlideInView } from "~/components/SlideInView";
import { makeTransparent } from "~/components/colors";
import { ProfileCard } from "~/components/profile";
import { blinkDie, resetDieSettings, programProfile } from "~/features/dice";
import { renameDie } from "~/features/dice/renameDie";
import {
  useActiveProfile,
  useConfirmActionSheet,
  useHasFirmwareUpdate,
  useWatchedPixel,
  useProfile,
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
      style={{ marginHorizontal: 60, textAlign: "center" }}
      value={name}
      onChangeText={(t) => {
        let name = t;
        while (
          name.length &&
          encodeUtf8(name).byteLength > Constants.maxAdvertisedNameByteSize
        ) {
          name = name.slice(0, -1);
        }
        setName(name);
      }}
      onEndEditing={() => onEndEditing(name)}
    />
  );
});

export function PixelFocusViewHeader({
  pairedDie,
  onUnpair,
  onFirmwareUpdate,
}: {
  pairedDie: PairedDie;
  onUnpair: () => void;
  onFirmwareUpdate: () => void;
}) {
  const appDispatch = useAppDispatch();
  const store = useAppStore();

  const profile = useProfile(pairedDie.profileUuid);

  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";
  const hasFirmwareUpdate = useHasFirmwareUpdate(pairedDie.pixelId);
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const showConfirmReset = useConfirmActionSheet(
    "Reset Die Settings",
    () => pixel && resetDieSettings(pixel, pairedDie.profileUuid, appDispatch)
  );
  const showConfirmTurnOff = useConfirmActionSheet(
    "Turn Die Off",
    () => {
      pixel?.turnOff();
    },
    {
      message:
        "Reminder: your die will stay off until placed back in its case with the lid closed. " +
        "Alternatively you can turn it back on by holding a magnet to its upper face.",
    }
  );
  const [renameVisible, setRenameVisible] = React.useState(false);
  const textInputRef = React.useRef<RNTextInput>(null);
  React.useEffect(() => {
    if (renameVisible && textInputRef.current) {
      textInputRef.current?.focus();
    }
  }, [renameVisible]);
  React.useEffect(() => {
    if (disabled) {
      setRenameVisible(false);
    }
  }, [disabled]);

  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const textColor =
    actionsMenuVisible || disabled
      ? colors.onSurfaceDisabled
      : colors.onSurface;
  return (
    <View>
      {!renameVisible ? (
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
              color: textColor,
            }}
          >
            {pairedDie.name}
          </Text>
          <ChevronDownIcon
            size={18}
            color={
              actionsMenuVisible ? colors.onSurfaceDisabled : colors.onSurface
            }
            backgroundColor={makeTransparent(colors.onBackground, 0.2)}
            style={{ marginBottom: 3 }}
          />
          <DieMenu
            visible={actionsMenuVisible}
            anchor={{ x: (windowWidth - 230) / 2, y: 80 }}
            disconnected={disabled}
            onDismiss={() => setActionsMenuVisible(false)}
            onUnpair={onUnpair}
            onUpdateFirmware={hasFirmwareUpdate ? onFirmwareUpdate : undefined}
            onRename={() => setRenameVisible(true)}
            onReset={() => showConfirmReset()}
            onTurnOff={() => showConfirmTurnOff()}
          />
          <FirmwareUpdateBadge
            pairedDie={pairedDie}
            style={{ position: "absolute", right: -15, top: 5 }}
          />
        </Pressable>
      ) : (
        pixel && (
          <PixelNameTextInput
            ref={textInputRef}
            pixel={pixel}
            onEndEditing={async (name) => {
              setRenameVisible(false);
              renameDie(pixel, name, profile, store);
            }}
          />
        )
      )}
    </View>
  );
}

function RollingDie({
  pairedDie,
  disabled,
}: {
  pairedDie: PairedDie;
  disabled: boolean;
}) {
  const pixel = useWatchedPixel(pairedDie);
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return (
    <PixelDieRenderer
      pixel={pairedDie}
      speed={disabled ? 0 : rolling ? 10 : 1}
    />
  );
}

export function PixelFocusView({
  pairedDie,
  onPress,
  onShowDetails,
  onShowRollsHistory,
  onEditProfile,
  style,
  ...props
}: {
  pairedDie: PairedDie;
  onPress: () => void;
  onShowDetails: () => void;
  onShowRollsHistory: () => void;
  onEditProfile: () => void;
} & Omit<ViewProps, "children">) {
  const store = useAppStore();

  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";

  const activeProfile = useActiveProfile(pairedDie);
  const transferring = useAppSelector(
    (state) => !!state.diceTransient.transfer
  );
  const [pickProfile, setPickProfile] = React.useState(false);

  const { colors } = useTheme();
  return (
    <SlideInView {...props} style={[{ gap: 10 }, style]}>
      <Pressable
        disabled={disabled}
        sentry-label="header-bar-select"
        style={{
          width: "70%",
          aspectRatio: 1,
          alignSelf: "center",
        }}
        onPress={() => {
          blinkDie(pixel);
          onPress?.();
        }}
      >
        <RollingDie pairedDie={pairedDie} disabled={disabled} />
      </Pressable>
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          marginVertical: 10,
          gap: 10,
        }}
      >
        <PixelRollsCard
          pairedDie={pairedDie}
          onPress={onShowRollsHistory}
          sentry-label="show-rolls-history"
          style={{ flex: 1, flexGrow: 1 }}
        />
        <PixelStatusCard
          pairedDie={pairedDie}
          onPress={onShowDetails}
          sentry-label="show-details"
          style={{ flex: 1, flexGrow: 1 }}
        />
      </View>
      <Text variant="titleMedium">Active Profile</Text>
      <ProfileCard
        row
        profile={activeProfile}
        transferring={transferring}
        // onPress={() => pixel && setPickProfile(true)}
      />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 40 }}>
        <TouchableRipple
          style={{ alignItems: "center" }}
          onPress={() => pixel && setPickProfile(true)}
        >
          <View style={{ alignItems: "center" }}>
            <MaterialCommunityIcons
              name="swap-horizontal-circle-outline"
              size={32}
              color={colors.onPrimary}
            />
            <Text variant="bodyMedium">Replace</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={onEditProfile}>
          <View style={{ alignItems: "center" }}>
            <MaterialCommunityIcons
              name="circle-edit-outline"
              size={32}
              color={colors.onPrimary}
            />
            <Text variant="bodyMedium">Customize</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={() => {}}>
          <View style={{ alignItems: "center" }}>
            <MaterialCommunityIcons
              name="export-variant"
              size={32}
              color={colors.onPrimary}
            />
            <Text variant="bodyMedium">Export</Text>
          </View>
        </TouchableRipple>
      </View>
      {/* Pick Profile Bottom Sheet */}
      {pixel && (
        <PickProfileBottomSheet
          pixel={pixel}
          onSelectProfile={(profile) => {
            if (!transferring) {
              setPickProfile(false);
              programProfile(pixel, profile, store);
            } else {
              console.log(
                "Skip programming profile because one is already in progress"
              );
            }
          }}
          visible={pickProfile}
          onDismiss={() => setPickProfile(false)}
        />
      )}
    </SlideInView>
  );
}

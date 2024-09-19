import { encodeUtf8 } from "@systemic-games/pixels-core-utils";
import { createLibraryProfile } from "@systemic-games/pixels-edit-animation";
import {
  Constants,
  Pixel,
  Serializable,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  useWindowDimensions,
  View,
  ViewProps,
} from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";

import { DieMenu } from "./DieMenu";
import { PickProfileBottomSheet } from "./PickProfileBottomSheet";
import { PixelRollsCard } from "./PixelRollsCard";
import { PixelStatusCard } from "./PixelStatusCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppStore } from "~/app/hooks";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { DebugPixelID } from "~/components/DebugPixelID";
import { FirmwareUpdateBadge } from "~/components/FirmwareUpdateBadge";
import { PairedDieRendererWithRoll } from "~/components/PairedDieRendererWithRoll";
import { SlideInView } from "~/components/SlideInView";
import { GradientButton } from "~/components/buttons";
import { makeTransparent } from "~/components/colors";
import { ProfileCard } from "~/components/profile";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { Library, preSerializeProfile, readProfile } from "~/features/store";
import {
  useConfirmActionSheet,
  useHasFirmwareUpdate,
  useIsModifiedDieProfile,
  usePixelsCentral,
  useProfile,
  useRegisteredPixel,
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
  const store = useAppStore();
  const central = usePixelsCentral();
  const pixel = useRegisteredPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const ready = status === "ready";
  const hasFirmwareUpdate = useHasFirmwareUpdate(pairedDie.pixelId);
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);

  const showConfirmReset = useConfirmActionSheet("Reset Die Settings", () => {
    if (ready) {
      // Schedule reset settings
      central.scheduleOperation(pairedDie.pixelId, {
        type: "resetSettings",
      });
      // Program default profile
      // Use profile with pre-serialized data so the hash is stable
      const defaultProfile = preSerializeProfile(
        createLibraryProfile("default", pairedDie.dieType),
        store.getState().library
      );
      store.dispatch(
        Library.Profiles.update({
          ...Serializable.fromProfile(defaultProfile),
          uuid: pairedDie.profileUuid,
          hash: computeProfileHashWithOverrides(defaultProfile),
        })
      );
    }
  });
  const showConfirmTurnOff = useConfirmActionSheet(
    "Turn Die Off",
    () =>
      ready &&
      central.scheduleOperation(pairedDie.pixelId, { type: "turnOff" }),
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
    if (!ready) {
      setRenameVisible(false);
    }
  }, [ready]);
  const renameDie = React.useCallback(
    (name: string) => {
      // Update name
      pixel &&
        central.scheduleOperation(pixel.pixelId, { type: "rename", name });
    },
    [central, pixel]
  );

  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const textColor =
    actionsMenuVisible || !ready ? colors.onSurfaceDisabled : colors.onSurface;
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
            anchor={{
              x: (windowWidth - 230) / 2,
              y: Platform.OS === "ios" ? 40 : 50,
            }}
            disconnected={!ready}
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
              const newName = name.trim();
              if (newName.length) {
                renameDie(newName);
              }
            }}
          />
        )
      )}
    </View>
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
  const central = usePixelsCentral();

  const pixel = useRegisteredPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";

  const profile = useProfile(pairedDie.profileUuid);
  const [showPickProfile, setShowPickProfile] = React.useState(false);
  const modifiedProfile = useIsModifiedDieProfile(
    profile.uuid,
    pairedDie.dieType
  );

  const { colors } = useTheme();
  return (
    <SlideInView {...props} style={[{ gap: 10 }, style]}>
      <DebugPixelID pixelId={pairedDie.pixelId} />
      <Pressable
        disabled={disabled}
        sentry-label="header-bar-select"
        style={{
          width: "70%",
          aspectRatio: 1,
          alignSelf: "center",
        }}
        onPress={() => {
          central.tryConnect(pairedDie.pixelId, { priority: "high" });
          central.scheduleOperation(pairedDie.pixelId, {
            type: "blink",
          });
          onPress?.();
        }}
      >
        <PairedDieRendererWithRoll pairedDie={pairedDie} disabled={disabled} />
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
      <Text variant="titleMedium">Profile</Text>
      <View>
        <ProfileCard
          profile={profile}
          modified={modifiedProfile}
          onPress={onEditProfile}
        />
        <Text
          variant="labelSmall"
          style={{
            position: "absolute",
            bottom: 2,
            right: 10,
            alignSelf: "flex-end",
            color: colors.onSurfaceDisabled,
          }}
        >
          Tap to customize
        </Text>
      </View>
      <GradientButton
        style={{ alignSelf: "center", alignItems: "center", marginTop: 10 }}
        onPress={() => setShowPickProfile(true)}
      >
        Copy Another Profile To Die
      </GradientButton>
      {/* Pick Profile Bottom Sheet */}
      <PickProfileBottomSheet
        pairedDie={pairedDie}
        onSelectProfile={(profile) => {
          setShowPickProfile(false);
          // Use profile with pre-serialized data so the hash is stable
          profile = preSerializeProfile(profile, store.getState().library);
          // Update die profile
          const sourceUuid = store
            .getState()
            .library.profiles.ids.includes(profile.uuid)
            ? profile.uuid
            : undefined; // Source profile not in library (it's a template)
          const profileData = Serializable.fromProfile(profile);
          store.dispatch(
            Library.Profiles.update({
              ...profileData,
              uuid: pairedDie.profileUuid,
              hash: computeProfileHashWithOverrides(profile),
              sourceUuid,
              // It's possible to use a profile from another die type
              // (ex: D00 & D10 share the same profiles)
              dieType: pairedDie.dieType,
            })
          );
          // Update profile instance
          readProfile(pairedDie.profileUuid, store.getState().library);
        }}
        visible={showPickProfile}
        onDismiss={() => setShowPickProfile(false)}
      />
    </SlideInView>
  );
}

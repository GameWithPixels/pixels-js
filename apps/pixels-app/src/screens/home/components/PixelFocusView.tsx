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
import { Badge, Text, TextInput, useTheme } from "react-native-paper";

import { DieMenu } from "./DieMenu";
import { PickProfileBottomSheet } from "./PickProfileBottomSheet";
import { PixelRollCard } from "./PixelRollCard";
import { PixelStatusCard } from "./PixelStatusCard";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PixelDieRenderer } from "~/components/DieRenderer";
import { NewPixelAppBanner } from "~/components/banners";
import { makeTransparent } from "~/components/colors";
import { ProfileCard, ProfileCardProps } from "~/components/profile";
import { blinkDie, transferProfile } from "~/features/dice";
import { renameDie } from "~/features/dice/renameDie";
import { FactoryProfile, getPixelStatusLabel } from "~/features/profiles";
import { setShowNewPixelsAppBanner } from "~/features/store/appSettingsSlice";
import {
  useActiveProfile,
  useConfirmActionSheet,
  useHasFirmwareUpdate,
  usePairedPixel,
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
  const profile = useProfile(pairedDie.profileUuid);

  const pixel = usePairedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const [pixelName] = usePixelValue(pixel, "name");
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  const disabled = status !== "ready";
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const showConfirmReset = useConfirmActionSheet("Reset Die Settings", () => {
    pixel?.sendMessage("clearSettings");
  });
  const showConfirmTurnOff = useConfirmActionSheet(
    "Turn Die Off",
    () => {
      pixel?.turnOff();
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
  React.useEffect(() => {
    if (disabled) {
      setRenameVisible(false);
    }
  }, [disabled]);

  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const color = actionsMenuVisible
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
              color,
            }}
          >
            {disabled ? getPixelStatusLabel(status) : pixelName}
          </Text>
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
            onUpdateFirmware={hasFirmwareUpdate ? onFirmwareUpdate : undefined}
            onRename={() => setRenameVisible(true)}
            onReset={() => showConfirmReset()}
            onTurnOff={() => showConfirmTurnOff()}
          />
          {hasFirmwareUpdate ? (
            <Badge style={{ position: "absolute", right: -15, top: 5 }}>
              !
            </Badge>
          ) : null}
        </Pressable>
      ) : (
        pixel && (
          <PixelNameTextInput
            ref={textInputRef}
            pixel={pixel}
            onEndEditing={async (name) => {
              setRenameVisible(false);
              renameDie(pixel, name, profile, appDispatch);
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
  const pixel = usePairedPixel(pairedDie);
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
  pairedDie,
  onPress,
  onShowDetails,
  onEditProfile,
  style,
  ...props
}: {
  pairedDie: PairedDie;
  onPress: () => void;
  onShowDetails: () => void;
  onEditProfile: () => void;
} & Omit<ViewProps, "children">) {
  const appDispatch = useAppDispatch();

  const pixel = usePairedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const activeProfile = useActiveProfile(pairedDie);
  const transferring = useAppSelector((state) => !!state.diceRolls.transfer);
  const [pickProfile, setPickProfile] = React.useState(false);

  const showNewPixelsAppBanner = useAppSelector(
    (state) => state.appSettings.showNewPixelsAppBanner
  );
  const wasBannerInitiallyVisible = React.useState(showNewPixelsAppBanner)[0];

  const disabled = status !== "ready";
  return (
    <>
      <View {...props} style={[{ gap: 10 }, style]}>
        {wasBannerInitiallyVisible && (
          <NewPixelAppBanner
            visible={showNewPixelsAppBanner}
            collapsedMarginBottom={-10}
            onHide={() => appDispatch(setShowNewPixelsAppBanner(false))}
          />
        )}
        <Pressable
          sentry-label="header-bar-select"
          disabled={disabled}
          style={{
            width: "60%",
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
            marginTop: 10,
            gap: 10,
          }}
        >
          <PixelRollCard
            pairedDie={pairedDie}
            style={{ flex: 1, flexGrow: 1 }}
          />
          <PixelStatusCard
            pairedDie={pairedDie}
            onPress={onShowDetails}
            style={{ flex: 1, flexGrow: 1 }}
          />
        </View>
        <Text variant="titleMedium">Active Profile</Text>
        <PixelProfile
          profile={activeProfile}
          transferring={transferring}
          onPress={() => pixel && setPickProfile(true)}
        />
        <Text variant="titleMedium">Available Dice</Text>
      </View>
      {pixel && (
        <PickProfileBottomSheet
          pixel={pixel}
          profile={activeProfile}
          onSelectProfile={(profile) => {
            if (!transferring) {
              setPickProfile(false);
              transferProfile(pixel, profile, appDispatch);
            } else {
              console.log(
                "Dropping profile transfer because one is already in progress"
              );
            }
          }}
          visible={pickProfile}
          onDismiss={() => setPickProfile(false)}
        />
      )}
    </>
  );
}

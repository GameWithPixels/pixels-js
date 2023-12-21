import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { assert } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelStatus,
  Profiles,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  useWindowDimensions,
  TextInput as RNTextInput,
  View,
  ViewProps,
} from "react-native";
import {
  Badge,
  Divider,
  Menu,
  MenuProps,
  Text,
  TextInput,
  ThemeProvider,
  useTheme,
} from "react-native-paper";
import Animated, {
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import CalibrateIcon from "#/icons/home/calibrate";
import { useAppSelector } from "~/app/hooks";
import { Card } from "~/components/Card";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { ProfilePicker } from "~/components/ProfilePicker";
import { AnimatedText } from "~/components/animated";
import { Chip, GradientChip } from "~/components/buttons";
import { BatteryIcon, RssiIcon } from "~/components/icons";
import { ProfileCard } from "~/components/profile";
import {
  getTextColorStyle,
  getIconColor,
  makeTransparent,
} from "~/components/utils";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { PairedDie } from "~/features/store/pairedDiceSlice";
import { useActiveProfile } from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

function DieMenu({
  onFirmwareUpdate,
  onRename,
  onUnpair,
  ...props
}: {
  onFirmwareUpdate: () => void;
  onRename: () => void;
  onUnpair: () => void;
} & Omit<MenuProps, "children" | "theme" | "containerStyle">) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <Menu
      contentStyle={{
        marginTop: Platform.select({ ios: 10, default: 0 }),
        width: 230,
      }}
      {...props}
    >
      <Menu.Item
        title="Update Firmware!"
        style={{
          backgroundColor: colors.errorContainer,
          borderRadius,
          margin: 5,
        }}
        titleStyle={{ color: colors.onErrorContainer }}
        trailingIcon={({ size, color }) => (
          <FontAwesome5 name="download" size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
          onFirmwareUpdate();
        }}
      />
      <Divider />
      <Menu.Item
        title="Rename"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons name="rename-box" size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
          onRename();
        }}
      />
      <Divider />
      <Menu.Item
        title="Forget Die"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons
            name="link-variant-off"
            size={size}
            color={color}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
          onUnpair();
        }}
      />
      <Divider />
      <Menu.Item
        title="Calibrate"
        trailingIcon={({ size, color }) => (
          <CalibrateIcon size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {}}
      />
      <Divider />
      <Menu.Item
        title="Reset Die Settings"
        trailingIcon={({ size, color }) => (
          <Feather name="refresh-ccw" size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {}}
      />
    </Menu>
  );
}

export function PixelFocusViewHeader({
  pixel,
  onUnpair,
  onFirmwareUpdate,
}: {
  pixel?: Pixel;
  onUnpair: () => void;
  onFirmwareUpdate: () => void;
}) {
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const [renameVisible, setRenameVisible] = React.useState(false);
  React.useEffect(() => {
    if (!pixel) {
      setRenameVisible(false);
    }
  }, [pixel]);
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
          onPress={() => setActionsMenuVisible(true)}
          style={{
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <Text
            variant="titleLarge"
            style={{
              paddingTop: 10,
              paddingHorizontal: 5,
              color,
            }}
          >
            {disabled ? `${status}...` : pixel.name}
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
                onDismiss={() => setActionsMenuVisible(false)}
                onFirmwareUpdate={onFirmwareUpdate}
                onRename={() => setRenameVisible(true)}
                onUnpair={onUnpair}
              />
              <Badge style={{ position: "absolute", right: -15, top: 5 }}>
                !
              </Badge>
            </>
          )}
        </Pressable>
      ) : (
        <TextInput
          ref={textInputRef}
          mode="flat"
          dense
          style={{
            marginHorizontal: 60,
            textAlign: "center",
          }}
          value={pixel.name}
          onEndEditing={() => setRenameVisible(false)}
        />
      )}
    </View>
  );
}

function AnimatedDieIcon({
  value,
  size,
  color,
  backgroundColor,
}: {
  value: number;
  size: number;
  color: string;
  backgroundColor: string;
}) {
  const sharedSize = useSharedValue(size);
  React.useEffect(() => {
    sharedSize.value = withTiming(size, {
      easing: Easing.out(Easing.quad),
      duration: 200,
    });
  }, [sharedSize, size]);
  const animStyle = useAnimatedStyle(() => ({
    fontSize: sharedSize.value,
  }));
  return (
    <Animated.View
      layout={CurvedTransition.easingX(Easing.bounce).duration(600)}
      entering={FadeIn.duration(400).delay(200)}
      exiting={FadeOut.duration(200)}
      style={{
        alignItems: "center",
        padding: 5,
        paddingHorizontal: value < 10 ? 10 : 5,
        borderRadius: 10,
        borderCurve: "continuous",
        backgroundColor,
      }}
    >
      <AnimatedText style={[animStyle, { color }]}>
        {value >= 0 ? String(value) : " "}
      </AnimatedText>
    </Animated.View>
  );
}

function PixelRssi({
  pixel,
  size,
  disabled,
}: {
  pixel: Pixel;
  size: number;
  disabled: boolean;
}) {
  const [rssi] = usePixelValue(pixel, "rssi");
  return <RssiIcon value={rssi} size={size} disabled={disabled} />;
}

function PixelBattery({
  pixel,
  size,
  disabled,
}: {
  pixel: Pixel;
  size: number;
  disabled: boolean;
}) {
  const [battery] = usePixelValue(pixel, "battery");
  return <BatteryIcon value={battery?.level} size={size} disabled={disabled} />;
}

function getStatusColor(status?: PixelStatus): string {
  return status === "ready"
    ? "green"
    : status === "connecting" || status === "identifying"
      ? "yellow"
      : "red";
}

function useLastRolls(pairedDie: PairedDie): { key: number; roll: number }[] {
  return useMemo(
    () =>
      [-1, -1, -1, -1] // We want at least 4 rolls
        .concat(pairedDie.rolls)
        .slice(pairedDie.rolls.length)
        .map((roll, i) => ({
          key: pairedDie.rolls.length + i,
          roll,
        })),
    [pairedDie.rolls]
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
  const status = usePixelStatus(pixel);
  const pairedDie = useAppSelector((state) =>
    state.pairedDice.dice.find((d) => d.pixelId === pixel.pixelId)
  );
  assert(pairedDie, `Pixel ${pixel.pixelId} is not paired!`);
  const lastRolls = useLastRolls(pairedDie);
  const disabled = status !== "ready";
  const { activeProfile, setActiveProfile } = useActiveProfile(pixel);
  const [transferring, setTransferring] = React.useState(false);
  const [pickProfile, setPickProfile] = React.useState(false);
  React.useEffect(() => {
    if (activeProfile) {
      setTransferring(true);
      setTimeout(() => setTransferring(false), 5000); //TODO get status from Pixel
    }
  }, [activeProfile]);

  const { colors } = useTheme();
  const textStyle = getTextColorStyle(colors, disabled);
  return (
    <>
      <View {...props} style={[{ gap: 10 }, style]}>
        <View
          style={{
            width: "50%",
            aspectRatio: 1,
            alignSelf: "center",
          }}
        >
          <DieRenderer dieType={pixel.dieType} colorway={pixel.colorway} />
        </View>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            marginTop: 10,
            gap: 10,
          }}
        >
          <Card
            style={{ flex: 1, flexGrow: 1, justifyContent: "center" }}
            contentStyle={{
              flexGrow: 1,
              padding: 10,
              alignItems: "flex-start",
              justifyContent: "space-around",
            }}
          >
            <Text style={textStyle}>Rolls:</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {lastRolls.map(({ key, roll }, i) => (
                <AnimatedDieIcon
                  key={key}
                  value={roll}
                  size={16 + 4 * i}
                  color={getIconColor(colors, disabled)}
                  backgroundColor={makeTransparent(colors.primary, 0.2)}
                />
              ))}
            </View>
            <Text
              variant="labelSmall"
              style={{ color: colors.onSurfaceDisabled }}
            >
              Tap to switch widget
            </Text>
          </Card>
          <Pressable style={{ flex: 1, flexGrow: 1 }} onPress={onShowDetails}>
            <Card
              style={{ flexGrow: 1 }}
              contentStyle={{
                flexGrow: 1,
                padding: 10,
                alignItems: "flex-start",
                justifyContent: "space-around",
                gap: 5,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text>Status:</Text>
                <View
                  style={{
                    width: 14,
                    aspectRatio: 1,
                    borderRadius: 7,
                    backgroundColor: getStatusColor(status),
                  }}
                />
                <View style={{ flexGrow: 1 }} />
                <PixelRssi pixel={pixel} size={16} disabled={disabled} />
                <PixelBattery pixel={pixel} size={16} disabled={disabled} />
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text style={textStyle}>Need charging!</Text>
                <MaterialCommunityIcons
                  name="power-plug-off-outline"
                  size={16}
                  color={colors.onSurface}
                />
              </View>
              <Text
                variant="labelSmall"
                style={{ color: colors.onSurfaceDisabled }}
              >
                Tap for more details
              </Text>
            </Card>
          </Pressable>
        </View>
        <Text variant="titleMedium">Active Profile</Text>
        <ProfileCard
          row
          profile={activeProfile}
          transferring={transferring}
          footer={
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                justifyContent: "space-around",
              }}
            >
              <GradientChip
                icon={({ size, color }) => (
                  <MaterialCommunityIcons
                    name="book-edit-outline"
                    size={size}
                    color={color}
                  />
                )}
                onPress={onEditProfile}
              >
                Customize
              </GradientChip>
              <Chip
                icon={({ size, color }) => (
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={size}
                    color={color}
                  />
                )}
                onPress={
                  () => {}
                  //navigation.navigate("pickProfile", { pixelId: pixel.pixelId })
                }
              >
                Switch
              </Chip>
            </View>
          }
        />
        <Text variant="titleMedium">Available Dice</Text>
      </View>
      <PickProfileBottomSheet
        pixel={pixel}
        profile={activeProfile}
        transferring={transferring}
        onSelectProfile={(profile) => {
          if (!transferring) {
            setActiveProfile(profile);
          }
        }}
        visible={pickProfile}
        onDismiss={() => setPickProfile(false)}
      />
    </>
  );
}

function PickProfileBottomSheet({
  pixel,
  profile,
  transferring,
  onSelectProfile,
  visible,
  onDismiss,
}: {
  pixel: Pixel;
  profile?: Readonly<Profiles.Profile>;
  transferring: boolean;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%", "92%"]}
      index={1}
      onDismiss={onDismiss}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={1}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
      <ThemeProvider theme={theme}>
        <Text
          variant="titleMedium"
          style={{ alignSelf: "center", paddingVertical: 10 }}
        >
          Active Profile on {pixel.name}
        </Text>
        <ProfilePicker
          selected={profile}
          dieType={pixel.dieType}
          transferring={transferring}
          onSelectProfile={onSelectProfile}
          style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
        />
      </ThemeProvider>
    </BottomSheetModal>
  );
}

import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  Color,
  Pixel,
  Profiles,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
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

import { PixelRollCard } from "./PixelRollCard";
import { PixelStatusCard } from "./PixelStatusCard";

import CalibrateIcon from "#/icons/home/calibrate";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { ProfilePicker } from "~/components/ProfilePicker";
import { Chip, GradientChip } from "~/components/buttons";
import { ProfileCard } from "~/components/profile";
import { makeTransparent } from "~/components/utils";
import { getPixelStatusLabel } from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
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
            {disabled ? getPixelStatusLabel(status) : pixel.name}
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

function RollingDie({ pixel, disabled }: { pixel: Pixel; disabled: boolean }) {
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return (
    <DieRenderer
      dieType={pixel.dieType}
      colorway={pixel.colorway}
      speed={disabled ? 0 : rolling ? 10 : 1}
    />
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
  const blink = React.useCallback(
    () =>
      pixel
        .blink(Color.dimMagenta, { duration: 1000, count: 2 })
        .catch(() => {}),
    [pixel]
  );
  React.useEffect(() => {
    // Blink when die is selected
    blink();
  }, [blink]);
  const { activeProfile, setActiveProfile } = useActiveProfile(pixel);
  const [transferring, setTransferring] = React.useState(false);
  const [pickProfile, setPickProfile] = React.useState(false);
  React.useEffect(() => {
    if (activeProfile) {
      setTransferring(true);
      setTimeout(() => setTransferring(false), 5000); //TODO get status from Pixel
    }
  }, [activeProfile]);

  const disabled = status !== "ready";
  return (
    <>
      <View {...props} style={[{ gap: 10 }, style]}>
        <Pressable
          style={{
            width: "50%",
            aspectRatio: 1,
            alignSelf: "center",
          }}
          onPress={blink}
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
          <PixelRollCard pixel={pixel} disabled={disabled} />
          <Pressable style={{ flex: 1, flexGrow: 1 }} onPress={onShowDetails}>
            <PixelStatusCard pixel={pixel} disabled={disabled} />
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

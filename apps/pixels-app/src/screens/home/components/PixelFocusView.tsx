import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Color,
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

import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { Chip, GradientChip } from "~/components/buttons";
import { ProfileCard } from "~/components/profile";
import { makeTransparent } from "~/components/utils";
import { getPixelStatusLabel } from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useActiveProfile, useConfirmActionSheet } from "~/hooks";

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
  const disabled = status !== "ready";
  const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
  const showConfirmReset = useConfirmActionSheet("Reset Die Settings", () => {
    pixel.sendMessage("clearSettings");
  });
  const showConfirmTurnOff = useConfirmActionSheet("Turn Die Off", () => {
    pixel.turnOff();
  });
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
                onDismiss={() => setActionsMenuVisible(false)}
                onFirmwareUpdate={onFirmwareUpdate}
                onRename={() => setRenameVisible(true)}
                onUnpair={onUnpair}
                onReset={() => showConfirmReset()}
                onTurnOff={() => showConfirmTurnOff()}
              />
              <Badge style={{ position: "absolute", right: -15, top: 5 }}>
                !
              </Badge>
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
                justifyContent: "space-around",
              }}
            >
              <GradientChip
                disabled={disabled}
                // icon={({ size, color }) => (
                //   <MaterialCommunityIcons
                //     name="book-edit-outline"
                //     size={size}
                //     color={color}
                //   />
                // )}
                onPress={onEditProfile}
              >
                Customize
              </GradientChip>
              <Chip
                disabled={disabled}
                icon={({ size, color }) => (
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={size}
                    color={color}
                  />
                )}
                onPress={() => setPickProfile(true)}
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
            setPickProfile(false);
          }
        }}
        visible={pickProfile}
        onDismiss={() => setPickProfile(false)}
      />
    </>
  );
}

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  DiceUtils,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import {
  Divider,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import {
  HeaderMenuButton,
  HeaderMenuButtonProps,
} from "~/components/HeaderMenuButton";
import { SliderWithValue } from "~/components/SliderWithValue";
import { DieWireframe } from "~/components/icons";
import { AvailableDieTypeValues } from "~/features/dice";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  addRollToRoller,
  removeAllRollerEntries,
  setRollerCardsAlignment,
  setRollerCardsSizeRatio,
  setRollerPaused,
} from "~/features/store";
import { useConfirmActionSheet } from "~/hooks";

function VirtualDiceLine({
  diceTypes,
  addRoll,
}: {
  diceTypes: PixelDieType[];
  addRoll: (dieType: PixelDieType, value: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        margin: 5,
        marginLeft: 10,
        alignSelf: "center",
      }}
    >
      {diceTypes.map((dieType) => (
        <TouchableRipple
          key={dieType}
          onPress={() => {
            const faces = DiceUtils.getDieFaces(dieType);
            addRoll(dieType, faces[Math.floor(Math.random() * faces.length)]);
          }}
        >
          <DieWireframe dieType={dieType} size={40} />
        </TouchableRipple>
      ))}
    </View>
  );
}

export function OptionsMenu({
  onLiveChangeSizeRatio,
  ...props
}: {
  onLiveChangeSizeRatio: (ratio: number) => void;
} & Omit<HeaderMenuButtonProps, "children">) {
  const store = useAppStore();
  const delayedDismiss = () =>
    setTimeout(() => {
      props.onDismiss?.();
    }, 200);
  const confirmClearAll = useConfirmActionSheet("Clear All Rolls", () => {
    store.dispatch(removeAllRollerEntries());
  });
  const paused = useAppSelector((state) => state.diceRoller.paused);
  const { cardsSizeRatio: sizeRatio, cardsAlignment: alignment } =
    useAppSelector((state) => state.diceRoller.settings);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const selectedStyle = {
    padding: 5,
    borderRadius,
    borderColor: colors.primary,
    borderWidth: 1,
  } as const;
  const unselectedStyle = {
    ...selectedStyle,
    borderColor: colors.background,
  } as const;
  return (
    <HeaderMenuButton {...props}>
      <Text variant="bodyLarge" style={{ marginHorizontal: 15 }}>
        Display Size
      </Text>
      <SliderWithValue
        percentage
        value={sizeRatio}
        onValueChange={onLiveChangeSizeRatio}
        onEndEditing={(v) => store.dispatch(setRollerCardsSizeRatio(v))}
        minimumValue={0.2}
        maximumValue={1}
        style={{ marginHorizontal: 10, marginBottom: 10 }}
      />
      <Divider />
      <Menu.Item
        title={paused ? "Paused" : "Running"}
        trailingIcon={() =>
          paused ? (
            <MaterialCommunityIcons
              name="play-outline"
              size={24}
              color={colors.onSurface}
            />
          ) : (
            <MaterialIcons name="pause" size={24} color={colors.onSurface} />
          )
        }
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          store.dispatch(setRollerPaused(!paused));
          delayedDismiss();
        }}
      />
      <Divider />
      <Menu.Item
        title="Clear All"
        trailingIcon={() => (
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={24}
            color={colors.onSurface}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          confirmClearAll();
          delayedDismiss();
        }}
      />
      <Divider />
      <Text variant="bodyLarge" style={{ marginHorizontal: 15, marginTop: 10 }}>
        Alignment
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          marginTop: 5,
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons
          name="align-horizontal-left"
          size={24}
          color={colors.onSurface}
          style={alignment === "left" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("left"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-center"
          size={24}
          color={colors.onSurface}
          style={alignment === "center" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("center"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-right"
          size={24}
          color={colors.onSurface}
          style={alignment === "right" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("right"));
            delayedDismiss();
          }}
        />
        <MaterialCommunityIcons
          name="align-horizontal-distribute"
          size={24}
          color={colors.onSurface}
          style={alignment === "alternate" ? selectedStyle : unselectedStyle}
          onPress={() => {
            store.dispatch(setRollerCardsAlignment("alternate"));
            delayedDismiss();
          }}
        />
      </View>
      <Divider />
      <Text variant="bodyLarge" style={{ marginHorizontal: 15, marginTop: 10 }}>
        Virtual Roll
      </Text>
      {[0, 1].map((i) => (
        <VirtualDiceLine
          key={i}
          diceTypes={AvailableDieTypeValues.slice(
            Math.ceil((i * AvailableDieTypeValues.length) / 2),
            Math.ceil(((i + 1) * AvailableDieTypeValues.length) / 2)
          )}
          addRoll={(dieType, value) => {
            store.dispatch(
              addRollToRoller({
                pixelId: 0,
                dieType,
                value,
              })
            );
            delayedDismiss();
          }}
        />
      ))}
    </HeaderMenuButton>
  );
}

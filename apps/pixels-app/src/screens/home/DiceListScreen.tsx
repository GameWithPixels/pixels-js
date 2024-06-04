import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Divider, IconButton, Text } from "react-native-paper";
import { FadeIn, FadeOut } from "react-native-reanimated";

import { PairDiceBottomSheet } from "./components/PairDiceBottomSheet";

import FocusIcon from "#/icons/home/focus";
import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { HeaderBar } from "~/components/HeaderBar";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { AnimatedGradientButton } from "~/components/buttons";
import { DiceGrid } from "~/components/dice";
import {
  DiceGrouping,
  DiceGroupingList,
  getDiceGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  setDiceGrouping,
  setDiceSortMode,
} from "~/features/store/appSettingsSlice";
import { useConnectToMissingPixels } from "~/hooks";
import { DiceListScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

type DiceViewMode = "focus" | "list" | "grid";

function PageHeader({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: DiceViewMode;
  onSelectViewMode: (viewMode: DiceViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.diceGrouping);
  const sortMode = useAppSelector((state) => state.appSettings.diceSortMode);
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 220 }}
        onShowMenu={() => setVisible(true)}
        onDismiss={() => setVisible(false)}
      >
        <Text variant="labelLarge" style={AppStyles.selfCentered}>
          View Modes
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginBottom: 5,
          }}
        >
          {(["focus", "list", "grid"] as DiceViewMode[]).map((vm, i) => {
            const Icon = i === 0 ? FocusIcon : i === 1 ? ListIcon : GridIcon;
            return (
              <IconButton
                key={vm}
                selected={viewMode === vm}
                size={24}
                icon={Icon}
                onPress={() => {
                  setVisible(false);
                  onSelectViewMode(vm);
                }}
              />
            );
          })}
        </View>
        <Divider />
        {/* <Menu.Item
          title="Sort"
          trailingIcon={() => (
            <MaterialCommunityIcons
              name="sort"
              size={24}
              color={colors.onSurface}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => {
            setVisible(false);
            setSortVisible(true);
          }}
        />
        <Divider />
        <Menu.Item
          title={`Auto Connect ${discoMode ? "Off" : "On"}`}
          trailingIcon={() => (
            <MaterialIcons
              name={discoMode ? "bluetooth-disabled" : "bluetooth-connected"}
              size={24}
              color={colors.onSurface}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => setDiscoMode((d) => !d)}
        /> */}
      </HeaderBar>
      <SortBottomSheet
        groups={DiceGroupingList}
        groupBy={groupBy}
        getGroupingLabel={getDiceGroupingLabel as (g: string) => string}
        onChangeGroupBy={(group) =>
          appDispatch(setDiceGrouping(group as DiceGrouping))
        }
        sortModes={SortModeList}
        getSortModeLabel={getSortModeLabel as (g: string) => string}
        getSortModeIcon={
          getSortModeIcon as (mode: string) => SortBottomSheetSortIcon
        }
        sortMode={sortMode}
        onChangeSortMode={(mode) =>
          appDispatch(setDiceSortMode(mode as SortMode))
        }
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function NoPairedDie({
  showPairDice,
  onPairDice,
}: {
  showPairDice?: boolean;
  onPairDice: () => void;
}) {
  return (
    // Set view height so Pair Die button is not clipped during exit animation
    <View style={{ height: 400, alignItems: "center", gap: 20 }}>
      <Card style={{ width: "100%" }}>
        <Card.Title title="No dice is paired with the app" />
        <Card.Content>
          <Text variant="bodyMedium">
            In order to customize your Pixels dice you need to pair them with
            the app.{"\n"}
            Tap on the button below to get started.
          </Text>
        </Card.Content>
      </Card>
      {!showPairDice && (
        <AnimatedGradientButton
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300).delay(200)}
          onPress={onPairDice}
        >
          Scan For Dice
        </AnimatedGradientButton>
      )}
    </View>
  );
}

function DiceListPage({
  navigation,
}: {
  navigation: DiceListScreenProps["navigation"];
}) {
  const [showPairDice, setShowPairDice] = React.useState(false);
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);

  // Pairing
  const hasPairedDice = pairedDice.length > 0;
  useFocusEffect(
    React.useCallback(() => {
      if (!hasPairedDice) {
        setShowPairDice(true);
      }
    }, [hasPairedDice])
  );

  // Scan for missing dice on showing page
  useFocusEffect(useConnectToMissingPixels());

  return (
    <>
      <View style={{ height: "100%" }}>
        <ScrollView
          contentContainerStyle={{
            padding: 10,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          <Text variant="headlineMedium">My Pixels Dice</Text>
          <BluetoothStateWarning />
          {!pairedDice.length ? (
            <NoPairedDie
              showPairDice={showPairDice}
              onPairDice={() => setShowPairDice(true)}
            />
          ) : (
            <DiceGrid
              dice={pairedDice}
              onSelectDie={(d) =>
                navigation.navigate("dieFocus", { pixelId: d.pixelId })
              }
              onPressNewDie={() => setShowPairDice(true)}
            />
          )}
        </ScrollView>
      </View>
      <PairDiceBottomSheet
        visible={showPairDice}
        onDismiss={() => setShowPairDice(false)}
      />
    </>
  );
}

export function DiceListScreen({ navigation }: DiceListScreenProps) {
  return (
    <AppBackground>
      <DiceListPage navigation={navigation} />
    </AppBackground>
  );
}

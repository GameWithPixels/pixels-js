import { range } from "@systemic-games/pixels-core-utils";
import { useMPCProp } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { PairMPCsBottomSheet } from "./components/PairMPCsBottomSheet";

import { PairedMPC } from "~/app/PairedMPC";
import { useAppSelector } from "~/app/hooks";
import { MPCsListScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { TouchableCard, TouchableCardProps } from "~/components/TouchableCard";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { syncMPCs, playAnimOnMPCs, stopAnimOnMPCs } from "~/features/mpcUtils";
import { useMPC } from "~/hooks";

function MPCCard({
  pairedMPC,
  ...props
}: {
  pairedMPC: PairedMPC;
} & TouchableCardProps) {
  const mpc = useMPC(pairedMPC.systemId);
  const status = useMPCProp(mpc, "status");
  return (
    <TouchableCard selectable gradientBorder="bright" {...props}>
      <Text
        numberOfLines={1}
        variant="bodyMedium"
        style={{ marginTop: 6, fontFamily: "LTInternet-Bold" }}
      >
        {pairedMPC.name}
      </Text>
      <Text>Status: {status}</Text>
      <Text>Role: {pairedMPC.role}</Text>
      <Text>LEDs count: {pairedMPC.ledCount}</Text>
    </TouchableCard>
  );
}

function MPCsList({
  pairedMPCs,
  onSelectMPC,
  style,
  ...props
}: {
  pairedMPCs: readonly PairedMPC[];
  onSelectMPC?: (pairedMPC: PairedMPC) => void;
} & ViewProps) {
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {pairedMPCs.map((mpc) => (
        <MPCCard
          key={mpc.systemId}
          pairedMPC={mpc}
          onPress={() => onSelectMPC?.(mpc)}
        />
      ))}
    </View>
  );
}

// TODO scan for MPCs
// Refresh card on MPC found (if paired but not initially found)
function MPCsListPage({
  navigation,
}: {
  navigation: MPCsListScreenProps["navigation"];
}) {
  const pairedMPCs = useAppSelector((state) => state.pairedMPCs.paired);

  // Pairing
  const [showPairDice, setShowPairDice] = React.useState(false);

  // Scan for missing dice on showing page
  // const central = usePixelsCentral();
  // useFocusEffect(
  //   React.useCallback(() => {
  //     central.tryReconnectDice();
  //     return () => setShowPairDice(false);
  //   }, [central])
  // );

  React.useEffect(() => {
    if (!pairedMPCs.length) {
      setShowPairDice(true);
    }
  }, [pairedMPCs.length]);

  return (
    <>
      <View style={{ height: "100%" }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
        >
          <BluetoothStateWarning style={{ marginVertical: 10 }}>
            <View style={{ gap: 10 }}>
              <OutlineButton onPress={() => navigation.navigate("rollToWin")}>
                Roll To Win
              </OutlineButton>
              <Text
                variant="titleLarge"
                style={{ alignSelf: "center", margin: 10 }}
              >
                MPCs
              </Text>
              <OutlineButton onPress={() => setShowPairDice(true)}>
                Add MPC
              </OutlineButton>
              <OutlineButton onPress={() => syncMPCs(pairedMPCs)}>
                Synchronize
              </OutlineButton>
              {range(0, 6).map((i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text variant="bodyLarge">Anim #{i}</Text>
                  <GradientButton
                    style={{ flex: 1 }}
                    onPress={() => playAnimOnMPCs(pairedMPCs, i)}
                  >
                    Play
                  </GradientButton>
                  <GradientButton
                    style={{ flex: 1 }}
                    onPress={() => stopAnimOnMPCs(pairedMPCs, i)}
                  >
                    Stop
                  </GradientButton>
                </View>
              ))}
              <MPCsList
                pairedMPCs={pairedMPCs}
                onSelectMPC={(pairedMpc) =>
                  navigation.navigate("mpcDetails", {
                    pixelId: pairedMpc.pixelId,
                  })
                }
              />
            </View>
          </BluetoothStateWarning>
        </ScrollView>
      </View>
      <PairMPCsBottomSheet
        visible={showPairDice}
        onDismiss={() => setShowPairDice(false)}
      />
    </>
  );
}

export function MPCsListScreen({ navigation }: MPCsListScreenProps) {
  return (
    <AppBackground topLevel>
      <MPCsListPage navigation={navigation} />
    </AppBackground>
  );
}

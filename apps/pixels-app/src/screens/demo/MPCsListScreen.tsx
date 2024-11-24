import {
  getMPC,
  MPC,
  useMPCProp,
} from "@systemic-games/react-native-pixels-connect";
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
import { useMPC } from "~/hooks";

function forEachMPC<T>(
  pairedMPCs: PairedMPC[],
  action: (mpc: MPC) => Promise<T>
): void {
  for (const p of pairedMPCs) {
    const mpc = getMPC(p.systemId);
    if (mpc) {
      action(mpc).catch((e) => console.log(String(e)));
    }
  }
}

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
              <Text
                variant="titleLarge"
                style={{ alignSelf: "center", margin: 10 }}
              >
                MPCs
              </Text>
              <OutlineButton onPress={() => setShowPairDice(true)}>
                Add MPC
              </OutlineButton>
              <OutlineButton
                onPress={() => forEachMPC(pairedMPCs, (mpc) => mpc.connect())}
              >
                Connect All
              </OutlineButton>
              <OutlineButton
                onPress={() => {
                  const referenceTime = 1000; // Arbitrary reference time
                  const maxDelayTime = 100; // Expected max delay before we've messages all controllers
                  const targetTime = Date.now() + maxDelayTime;
                  forEachMPC(pairedMPCs, (mpc) =>
                    mpc.sync(targetTime, referenceTime)
                  );
                }}
              >
                Synchronize
              </OutlineButton>
              <GradientButton
                onPress={() => forEachMPC(pairedMPCs, (mpc) => mpc.playAnim(1))}
              >
                Play Animation 1
              </GradientButton>
              <GradientButton
                onPress={() => forEachMPC(pairedMPCs, (mpc) => mpc.stopAnim(1))}
              >
                Stop Animation 1
              </GradientButton>
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

import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import {
  getMPC,
  MPC,
  useMPCProp,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { MPCRoles, PairedMPC } from "~/app/PairedMPC";
import { useAppDispatch } from "~/app/hooks";
import { MPCDetailsScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { PixelConnectionStatus } from "~/components/PixelConnectionStatus";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { OutlineButton } from "~/components/buttons";
import { getPixelStatusLabel } from "~/features/profiles";
import {
  removePairedMPC,
  setPairedMPCRole,
} from "~/features/store/pairedMPCsSlice";
import { useMPC, useSetSelectedPairedMPC } from "~/hooks";

function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <Text variant="titleMedium" style={{ paddingTop: 8, marginBottom: -2 }}>
      {children}
    </Text>
  );
}

export function MPCStatus({ mpc, style, ...props }: { mpc?: MPC } & ViewProps) {
  const status = useMPCProp(mpc, "status");
  const rssi = useMPCProp(mpc, "rssi");
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>General</SectionTitle>
      <View style={styles.paragraph}>
        <Text>
          {status ? (
            <>
              {"Connection Status: "}
              <PixelConnectionStatus
                status={status}
                size={16}
                color={colors.onSurface}
              />
              {` ${getPixelStatusLabel(status)}`}
            </>
          ) : (
            "MPC not found so far"
          )}
        </Text>
        {mpc?.status === "ready" && (
          <>
            <Text>
              RSSI:{" "}
              <MaterialCommunityIcons
                name="signal"
                size={16}
                color={colors.onSurface}
              />{" "}
              {rssi ?? mpc.rssi} dBm
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function MPCAdvancedInfo({
  pairedMPC,
  mpc,
  style,
  ...props
}: {
  pairedMPC: PairedMPC;
  mpc?: MPC;
} & ViewProps) {
  const firmwareDate = useMPCProp(mpc, "firmwareDate");
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>MPC</SectionTitle>
      <View style={styles.paragraph}>
        <Text>Pixel ID: {unsigned32ToHex(pairedMPC.pixelId)}</Text>
        <Text>LED Count: {pairedMPC.ledCount ?? 0}</Text>
      </View>
      <SectionTitle>Firmware</SectionTitle>
      <View style={styles.paragraph}>
        <Text>
          Build Timestamp:{" "}
          {firmwareDate?.getTime()
            ? firmwareDate.toLocaleString()
            : new Date(pairedMPC.firmwareTimestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

function useAssignRoleActionSheet(pairedMPC: PairedMPC): () => void {
  const appDispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();
  const { colors } = useTheme();
  return React.useCallback(() => {
    showActionSheetWithOptions(
      {
        options: [...MPCRoles, "Cancel"],
        cancelButtonIndex: MPCRoles.length,
        containerStyle: { backgroundColor: colors.background },
        textStyle: { color: colors.onBackground },
      },
      (selectedIndex?: number) => {
        const role = MPCRoles[selectedIndex ?? -1];
        if (role) {
          appDispatch(setPairedMPCRole({ pixelId: pairedMPC.pixelId, role }));
        }
      }
    );
  }, [appDispatch, colors, pairedMPC, showActionSheetWithOptions]);
}

function MPCConfig({
  pairedMPC: mpc,
  style,
  ...props
}: { pairedMPC: PairedMPC } & ViewProps) {
  const showAssignRoleActionSheet = useAssignRoleActionSheet(mpc);
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>Config</SectionTitle>
      <View style={{ ...styles.paragraph, flexDirection: "row" }}>
        <Text>Role: {mpc.role}</Text>
        <OutlineButton onPress={() => showAssignRoleActionSheet()}>
          Change
        </OutlineButton>
      </View>
      <View style={{ ...styles.paragraph, flexDirection: "row" }}>
        <OutlineButton
          onPress={() => {
            const pmpc = getMPC(mpc.pixelId);
            if (pmpc) {
              pmpc.playAnim(0, 0, MPCRoles.indexOf(mpc.role), 0);
            }
          }}
        >
          Blink
        </OutlineButton>
      </View>
    </View>
  );
}

function MPCDetailsPage({
  pairedMPC,
  navigation,
}: {
  pairedMPC: PairedMPC;
  navigation: MPCDetailsScreenProps["navigation"];
}) {
  const mpc = useMPC(pairedMPC.systemId);
  const appDispatch = useAppDispatch();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        {pairedMPC.name}
      </PageHeader>
      <GHScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        <MPCStatus mpc={mpc} style={{ marginTop: 10 }} />
        <MPCConfig pairedMPC={pairedMPC} />
        <MPCAdvancedInfo pairedMPC={pairedMPC} mpc={mpc} />
        <OutlineButton
          onPress={() => {
            appDispatch(removePairedMPC(pairedMPC.pixelId));
            mpc?.disconnect().catch((e) => console.error(String(e)));
          }}
        >
          Unpair
        </OutlineButton>
      </GHScrollView>
    </View>
  );
}

export function MPCDetailsScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: MPCDetailsScreenProps) {
  const pairedMPC = useSetSelectedPairedMPC(pixelId);
  React.useEffect(() => {
    if (!pairedMPC) {
      navigation.goBack();
    }
  }, [pairedMPC, navigation]);
  return !pairedMPC ? null : (
    <AppBackground>
      <MPCDetailsPage pairedMPC={pairedMPC} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    marginLeft: 10,
    marginBottom: 10,
    gap: 5,
  },
});

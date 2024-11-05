import { useActionSheet } from "@expo/react-native-action-sheet";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";

import {
  PixelFocusView,
  PixelFocusViewHeader,
} from "./components/PixelFocusView";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch } from "~/app/hooks";
import { DieFocusScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { DebugConnectionStatusesBar } from "~/components/DebugConnectionStatusesBar";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { removePairedDie } from "~/features/store";
import { usePixelsCentral, useSetSelectedPairedDie } from "~/hooks";

function useUnpairActionSheet(
  pairedDie: PairedDie | undefined,
  navigation: DieFocusScreenProps["navigation"]
): () => void {
  const appDispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();

  const { colors } = useTheme();
  const unpairDieWithConfirmation = React.useCallback(() => {
    showActionSheetWithOptions(
      {
        options: [`Unpair ${pairedDie?.name}`, "Keep Die"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        destructiveColor: colors.error,
        containerStyle: { backgroundColor: colors.background },
        textStyle: { color: colors.onBackground },
      },
      (selectedIndex?: number) => {
        if (pairedDie && selectedIndex === 0) {
          // Leave screen first so that the die is not removed while the screen is still visible
          navigation.goBack();
          appDispatch(removePairedDie(pairedDie.pixelId));
        }
      }
    );
  }, [
    appDispatch,
    colors.background,
    colors.error,
    colors.onBackground,
    navigation,
    pairedDie,
    showActionSheetWithOptions,
  ]);

  return unpairDieWithConfirmation;
}

function DieFocusPage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: DieFocusScreenProps["navigation"];
}) {
  const central = usePixelsCentral();
  const showUnpairActionSheet = useUnpairActionSheet(pairedDie, navigation);

  useFocusEffect(
    React.useCallback(() => {
      central.tryConnect(pairedDie.pixelId, { priority: "high" });
      // TODO blink if connected or on successful connection
      central.scheduleOperation(pairedDie.pixelId, {
        type: "blink",
      });
    }, [central, pairedDie.pixelId])
  );

  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        <PixelFocusViewHeader
          pairedDie={pairedDie}
          onUnpair={showUnpairActionSheet}
          onFirmwareUpdate={() => navigation.navigate("firmwareUpdate")}
        />
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        <BluetoothStateWarning />
        <DebugConnectionStatusesBar />
        <PixelFocusView
          pairedDie={pairedDie}
          onPress={() =>
            central.tryConnect(pairedDie.pixelId, { priority: "high" })
          }
          onShowDetails={() =>
            navigation.navigate("dieDetails", {
              pixelId: pairedDie.pixelId,
            })
          }
          onShowRollsHistory={() =>
            navigation.navigate("dieRollsHistory", {
              pixelId: pairedDie.pixelId,
            })
          }
          onEditProfile={() =>
            navigation.navigate("editDieProfileStack", {
              screen: "editDieProfile",
              params: { pixelId: pairedDie.pixelId },
            })
          }
        />
      </ScrollView>
    </View>
  );
}

export function DieFocusScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: DieFocusScreenProps) {
  const pairedDie = useSetSelectedPairedDie(pixelId);
  if (!pairedDie) {
    navigation.goBack();
    return null;
  }
  return (
    <AppBackground>
      <DieFocusPage pairedDie={pairedDie} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}

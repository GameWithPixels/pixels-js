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
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { removePairedDie } from "~/features/store";
import {
  useConnectToMissingPixels,
  usePixelsCentral,
  useSetSelectedPairedDie,
} from "~/hooks";
import { DieFocusScreenProps } from "~/navigation";

function useUnpairActionSheet(pairedDie?: PairedDie): () => void {
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
          appDispatch(removePairedDie(pairedDie.pixelId));
        }
      }
    );
  }, [appDispatch, colors, pairedDie, showActionSheetWithOptions]);

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
  const connectToMissingPixels = useConnectToMissingPixels();
  const showUnpairActionSheet = useUnpairActionSheet(pairedDie);

  useFocusEffect(
    React.useCallback(() => {
      central.getScheduler(pairedDie.pixelId).schedule({ type: "blink" });
      connectToMissingPixels(pairedDie.pixelId);
    }, [central, pairedDie.pixelId, connectToMissingPixels])
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
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        <BluetoothStateWarning />
        <PixelFocusView
          pairedDie={pairedDie}
          onPress={() => connectToMissingPixels(pairedDie.pixelId)}
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

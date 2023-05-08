import { useFocusEffect } from "@react-navigation/native";
import {
  BaseStyles,
  FastButton,
  FastHStack,
  FastVStack,
  PixelAppPage,
  PixelInfoHCard,
  PixelInfoVCard,
} from "@systemic-games/react-native-pixels-components";
import {
  ScannedPixel,
  useScannedPixels,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

import {
  useAppPairedDice,
  useAppProfiles,
  useAppUpdatePairedDie,
} from "~/app/hooks";
import getCachedDataSet from "~/features/appDataSet/getCachedDataSet";
import DieRenderer from "~/features/render3d/DieRenderer";
import { HomeScreenProps } from "~/navigation";

function PairedPixels({
  navigation,
  pixels,
}: {
  navigation: HomeScreenProps["navigation"];
  pixels: ScannedPixel[];
}) {
  const pairedDice = useAppPairedDice();
  const profiles = useAppProfiles();
  const onPress = React.useCallback(
    (pixel: ScannedPixel) => {
      navigation.navigate("PixelDetails", { pixelId: pixel.pixelId });
    },
    [navigation]
  );
  return (
    <FastHStack w="100%" flexWrap="wrap" justifyContent="center">
      {pixels.map((pixel, i) => {
        const uuid = pairedDice.find(
          (d) => d.pixelId === pixel.pixelId
        )?.profileUuid;
        const profile = profiles.find((p) => p.uuid === uuid);
        return (
          <PixelInfoVCard
            key={pixel.pixelId}
            w="50%"
            mt={i > 2 ? 20 : 0}
            aspectRatio={1}
            pixel={pixel}
            title={profile?.name ?? pixel.name}
            onPress={() => onPress(pixel)}
            dieRenderer={() => (
              <DieRenderer
                renderData={profile ? getCachedDataSet(profile) : undefined}
              />
            )}
          />
        );
      })}
    </FastHStack>
  );
}

function UnpairedPixels({ pixels }: { pixels: ScannedPixel[] }) {
  const updatePairedDie = useAppUpdatePairedDie();
  const pairAll = React.useCallback(
    () => pixels.forEach((p) => updatePairedDie({ pixelId: p.pixelId })),
    [pixels, updatePairedDie]
  );
  const theme = useTheme();
  const borderRadius = (theme.isV3 ? 5 : 1) * theme.roundness;
  return (
    <FastVStack gap={10} w="100%">
      <FastHStack alignItems="center" justifyContent="space-between">
        <Text variant="titleMedium">Available Dice To Pair</Text>
        <FastButton onPress={pairAll}>Pair All</FastButton>
      </FastHStack>
      {pixels.map((pixel) => (
        <PixelInfoHCard
          key={pixel.pixelId}
          width="100%"
          height={90}
          p={5}
          borderRadius={borderRadius}
          borderWidth={1}
          borderColor={theme.colors.primary}
          bg={theme.colors.background}
          pixel={pixel}
          dieRenderer={() => <DieRenderer />}
        >
          <View style={BaseStyles.spacer} />
          <FastButton
            height="50%"
            alignSelf="center"
            onPress={() => updatePairedDie({ pixelId: pixel.pixelId })}
          >
            Pair
          </FastButton>
        </PixelInfoHCard>
      ))}
    </FastVStack>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [scannedPixels, scannerDispatch] = useScannedPixels();
  useFocusEffect(
    React.useCallback(() => {
      scannerDispatch("start");
      return () => {
        scannerDispatch("stop");
      };
    }, [scannerDispatch])
  );
  // TODO work around for scanned Pixels showing up multiple time after fast reload
  // React.useEffect(() => {
  //   console.log("FIXME START")
  //   scannerDispatch("start");
  //   return () => {
  //     console.log("FIXME STOP")
  //     scannerDispatch("clear");
  //     scannerDispatch("stop");
  //   };
  // }, [scannerDispatch]);
  // if (scannedPixels.length)
  //   console.log("SCANNED: " + scannedPixels.map((p) => p.name).join(", "));

  const pairedDice = useAppPairedDice();
  const unpairedPixels = React.useMemo(
    () =>
      scannedPixels.filter((p) =>
        pairedDice.every((d) => d.pixelId !== p.pixelId)
      ),
    [pairedDice, scannedPixels]
  );
  const pairedPixels = React.useMemo(
    () =>
      scannedPixels.filter(
        (p) => pairedDice.findIndex((d) => d.pixelId === p.pixelId) >= 0
      ),
    [pairedDice, scannedPixels]
  );

  const showGreetings = !pairedPixels.length && !unpairedPixels.length;
  const theme = useTheme();
  return (
    <PixelAppPage style={{ backgroundColor: theme.colors.background }}>
      <ScrollView style={BaseStyles.fullSizeFlex}>
        {pairedPixels.length > 0 && (
          <Card>
            <Card.Content>
              <PairedPixels navigation={navigation} pixels={pairedPixels} />
            </Card.Content>
          </Card>
        )}
        <View style={{ height: 10 }} />
        {unpairedPixels.length > 0 && (
          <Card>
            <Card.Content>
              <UnpairedPixels pixels={unpairedPixels} />
            </Card.Content>
          </Card>
        )}
        {showGreetings && (
          <Text
            variant="headlineMedium"
            style={{ paddingTop: 100, textAlign: "center" }}
          >
            It's time to unbox your dice!
          </Text>
        )}
      </ScrollView>
    </PixelAppPage>
  );
}

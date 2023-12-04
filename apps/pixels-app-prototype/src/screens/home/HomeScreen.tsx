import { useFocusEffect } from "@react-navigation/native";
import {
  BaseButton,
  BaseHStack,
  BaseVStack,
  PixelAppPage,
  PixelInfoHCard,
  PixelInfoVCard,
  RoundedBox,
  getBorderRadius,
} from "@systemic-games/react-native-pixels-components";
import {
  ScannedPixel,
  useScannedPixels,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Image, ScrollView, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import {
  useAppPairedDice,
  useAppProfiles,
  useAppUpdatePairedDie,
} from "~/app/hooks";
import { getCachedDataSet } from "~/features/appDataSet/getCachedDataSet";
import { DieRenderer } from "~/features/render3d/DieRenderer";
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
    <BaseHStack w="100%" flexWrap="wrap" justifyContent="center">
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
    </BaseHStack>
  );
}

function UnpairedPixels({ pixels }: { pixels: ScannedPixel[] }) {
  const updatePairedDie = useAppUpdatePairedDie();
  const pairAll = React.useCallback(
    () => pixels.forEach((p) => updatePairedDie({ pixelId: p.pixelId })),
    [pixels, updatePairedDie]
  );
  const theme = useTheme();
  return (
    <BaseVStack gap={10} w="100%">
      <BaseHStack alignItems="center" justifyContent="space-between">
        <Text variant="titleMedium">Available Dice To Pair</Text>
        <BaseButton onPress={pairAll}>Pair All</BaseButton>
      </BaseHStack>
      {pixels.map((pixel) => (
        <PixelInfoHCard
          key={pixel.pixelId}
          width="100%"
          height={90}
          p={5}
          borderRadius={getBorderRadius(theme)}
          borderWidth={1}
          borderColor={theme.colors.primary}
          bg={theme.colors.background}
          pixel={pixel}
          dieRenderer={() => <DieRenderer />}
        >
          <View style={AppStyles.spacer} />
          <BaseButton
            height="50%"
            alignSelf="center"
            onPress={() => updatePairedDie({ pixelId: pixel.pixelId })}
          >
            Pair
          </BaseButton>
        </PixelInfoHCard>
      ))}
    </BaseVStack>
  );
}

export function HomeScreen({ navigation }: HomeScreenProps) {
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
      <ScrollView
        style={AppStyles.fullSizeFlex}
        contentContainerStyle={{
          minHeight: "100%", // So we can center items in the page
        }}
      >
        <Image
          style={{ width: "50%", alignSelf: "center" }}
          resizeMode="contain"
          source={require("!/UI_Icons/pixels-logo.png")}
        />
        <RoundedBox border px={10} py={15}>
          <Text variant="titleLarge">Welcome to the new Pixel App!</Text>
          <Text style={{ marginTop: 5 }}>Expect more to come ;-)</Text>
        </RoundedBox>
        <View style={AppStyles.spacer} />
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
          <Text variant="headlineMedium" style={AppStyles.textCentered}>
            It's time to unbox your dice!
          </Text>
        )}
        <View style={AppStyles.spacer} />
      </ScrollView>
    </PixelAppPage>
  );
}

import { FontAwesome5 } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import {
  Card,
  FaceMask,
  PixelTheme,
  PxAppPage,
  createPixelTheme,
  LightingStyleSelection,
  SliderComponent,
  ColorSelection,
} from "@systemic-games/react-native-pixels-components";
import { VStack, Image, ScrollView, Center, Input } from "native-base";
import React from "react";

import { AnimationSettingsScreenRouteProps } from "~/Navigation";

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

export default function AnimationSettingsScreen() {
  const route = useRoute<AnimationSettingsScreenRouteProps>();
  const patternInfo = route.params;
  return (
    <PxAppPage theme={paleBluePixelTheme} h="100%">
      <VStack space={1} h="100%">
        <Center bg="white" rounded="lg" px={2} h={9}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={18} color="black" />
            }
            size="lg"
            variant="unstyled"
            placeholder={patternInfo.name}
            color="black"
          />
        </Center>
        <Card bg="pixelColors.softBlack" shadow={0} w="100%" p={0}>
          <Image
            source={patternInfo.imageRequirePath}
            size={160}
            alt="description of image"
          />
        </Card>
        <LightingStyleSelection />
        <ScrollView>
          <VStack p={2} space={2} bg="gray.700" rounded="md">
            <SliderComponent
              sliderTitle="Duration"
              minValue={0.1}
              maxValue={10}
              steps={0.1}
              unit="sec"
              sliderBoxColor="PixelColors.accentPurple"
              sliderTrackColor="PixelColors.pink"
              unitTextColor={undefined}
              sliderThumbColor={undefined}
            />
            <FaceMask dieFaces={20} />
            <ColorSelection />
            <SliderComponent
              sliderTitle="Repeat Count"
              minValue={0}
              maxValue={10}
              steps={1}
              unit=""
              sliderBoxColor="PixelColors.accentPurple"
              sliderTrackColor="PixelColors.pink"
              unitTextColor={undefined}
              sliderThumbColor={undefined}
            />
            <SliderComponent
              sliderTitle="Fading Sharpness"
              minValue={0.1}
              maxValue={1}
              steps={0.1}
              unit=""
              sliderBoxColor="PixelColors.accentPurple"
              sliderTrackColor="PixelColors.pink"
              unitTextColor={undefined}
              sliderThumbColor={undefined}
            />
          </VStack>
        </ScrollView>
      </VStack>
    </PxAppPage>
  );
}

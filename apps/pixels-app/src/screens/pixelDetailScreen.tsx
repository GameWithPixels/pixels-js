import {
  BatteryLevel,
  Card,
  PixelTheme,
  PxAppPage,
  RSSIStrength,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, Text, VStack, Image, HStack } from "native-base";

export default function PixelDetailScreen() {
  return (
    <PxAppPage theme={PixelTheme}>
      <Center>
        <Card w="100%">
          <VStack space={4}>
            <Text>Rename Pixel</Text>
            <Box alignItems="center">
              {/* PlaceHolderImage : would be replaced by 3d render of dice */}
              <Image
                size={20}
                source={require("../../../../apps/pixels-app/assets/UI_Icons/D10.png")}
                alt="placeHolder"
              />
            </Box>
            <HStack space={5}>
              <BatteryLevel iconSize="2xl" percentage={1} />
              <RSSIStrength iconSize="2xl" percentage={-60} />
            </HStack>
            <Text>Blink</Text>
            <Text>Change profile</Text>
            <Text>Stats</Text>
            <Text>Frimware date</Text>
            <Text>Advanced settings</Text>
          </VStack>
        </Card>
      </Center>
    </PxAppPage>
  );
}

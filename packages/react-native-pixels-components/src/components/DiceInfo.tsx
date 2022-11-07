import { Card } from "@systemic-games/react-native-base-components";
import { HStack, VStack, Text, Box, Image } from "native-base";

import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

export interface PixelInfo {
  name: string;
  rssi: number;
  batteryLevel: number;
  ledCount: number;
  firmwareDate: Date;
  profileName: string;
}

export interface PixelInfoProps {
  pixel: PixelInfo;
}

export function PixelInfoComponent({ pixel }: PixelInfoProps) {
  return (
    <Card borderWidth={2} maxW="100%">
      <HStack space={6} alignItems="center">
        <Box alignItems="center">
          {/* PlaceHolderImage : would be replaced by 3d render of dice */}
          <Image
            size="16"
            source={require("../../../../apps/pixels-app/assets/UI_Icons/D10.png")}
            alt="placeHolder"
          />
        </Box>
        {/* dice infos */}
        <HStack space={5} alignItems="baseline">
          <VStack space={1} alignItems="baseline">
            <Text bold>{pixel.name}</Text>
            <Text fontSize="xs"> Face {pixel.ledCount} up</Text>
            <BatteryLevel iconSize="2xl" percentage={pixel.batteryLevel} />
          </VStack>
          <VStack space={1} alignItems="baseline">
            <HStack alignItems="center" space={2}>
              <Text fontSize="2xs">
                Firmware : {pixel.firmwareDate.toDateString()}
              </Text>
            </HStack>
            <Text fontSize="xs"> Profile : {pixel.profileName}</Text>
            <RSSIStrength iconSize="2xl" percentage={pixel.rssi} />
          </VStack>
        </HStack>
      </HStack>
    </Card>
  );
}

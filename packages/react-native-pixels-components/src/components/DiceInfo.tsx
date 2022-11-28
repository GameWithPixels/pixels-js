import { Card } from "@systemic-games/react-native-base-components";
import {
  HStack,
  VStack,
  Text,
  Box,
  Image,
  Pressable,
  Button,
  Spacer,
  useDisclose,
} from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType, PixelRatio } from "react-native";

import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

export interface PixelInfo {
  name: string;
  rssi: number;
  batteryLevel: number;
  ledCount: number;
  firmwareDate: string; //date.toString
  profileName: string;
  pixelId: number;

  //Temporary for showing different images until 3d render
  imageRequirePath?: ImageSourcePropType;
}

export interface PixelInfoCardProps {
  h?: number | string;
  w?: number | string;
  pixel: PixelInfo;
  onPress?: (() => void) | null | undefined;
}

export function PairedPixelInfoComponent({
  pixel,
  onPress,
}: PixelInfoCardProps) {
  const imageSize = PixelRatio.getPixelSizeForLayoutSize(20);
  const fontsize = PixelRatio.getPixelSizeForLayoutSize(5);
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={100} w="100%" h={110}>
        <HStack space={6} alignItems="center" maxW="100%" h="100%">
          <Box alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={imageSize}
              // source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          {/* dice infos */}
          <HStack space={4} h="100%" w="100%">
            <VStack space={1} alignItems="baseline" h="100%">
              <Text flex={1} bold fontSize={fontsize}>
                {pixel.name}
              </Text>
              <Text flex={1} fontSize="xs">
                Face up: {pixel.ledCount}
              </Text>
              <Box flex={1}>
                <BatteryLevel iconSize={10} percentage={pixel.batteryLevel} />
              </Box>
            </VStack>
            <VStack space={1} alignItems="baseline" h="100%">
              <Text flex={1} fontSize="2xs" isTruncated>
                Firmware: {pixel.firmwareDate}
              </Text>
              <Text flex={1} isTruncated fontSize="xs">
                Profile: {pixel.profileName}
              </Text>
              <Box flex={1}>
                <RSSIStrength iconSize={10} percentage={pixel.rssi} />
              </Box>
            </VStack>
          </HStack>
        </HStack>
      </Card>
    </Pressable>
  );
}

export function SquarePairedPixelInfo({
  h,
  w,
  pixel,
  onPress,
}: PixelInfoCardProps) {
  const { onOpen } = useDisclose();
  const imageSize = PixelRatio.getPixelSizeForLayoutSize(20);
  return (
    <>
      <Pressable
        onPress={() => {
          onPress?.();
          onOpen();
        }}
      >
        <Card
          paddingTop={0}
          borderWidth={1}
          p={2}
          w={w}
          minH="40"
          verticalSpace={1}
          h={h}
        >
          <Text bold alignSelf="center">
            {pixel.name}
          </Text>
          <Box alignItems="center" paddingBottom={2}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={imageSize}
              //source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          <Text isTruncated fontSize="xs">
            Profile : {pixel.profileName}
          </Text>
          <Text fontSize="xs">Face Up: {pixel.ledCount}</Text>
          <HStack space={2} w="100%">
            <Box flex={1}>
              <BatteryLevel iconSize={2} percentage={pixel.batteryLevel} />
            </Box>
            <Box flex={1}>
              <RSSIStrength iconSize={2} percentage={pixel.rssi} />
            </Box>
          </HStack>
        </Card>
      </Pressable>
    </>
  );
}

export function ScannedPixelInfoComponent({
  pixel,
  onPress,
}: PixelInfoCardProps) {
  const [pressed, SetPressed] = React.useState(false);
  const [height, SetHeight] = React.useState("100px");
  const imageSize = PixelRatio.getPixelSizeForLayoutSize(20);
  return (
    <Pressable
      onPress={() => {
        SetHeight("180px");
        SetPressed(true);
      }}
    >
      <Card borderWidth={1.5} w="100%" h={height} alignItems="center">
        <HStack space={10} alignItems="center" maxW="100%">
          <Box alignItems="center" flex={1}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={imageSize}
              //source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          {/* dice infos */}
          <HStack space={5} alignItems="baseline" flex={2}>
            <VStack space={2}>
              <Text bold>{pixel.name}</Text>
              <Text fontSize="xs">Face Up: {pixel.ledCount} </Text>
            </VStack>
            <VStack space={2}>
              <BatteryLevel percentage={pixel.batteryLevel} iconSize={2} />
              <RSSIStrength percentage={pixel.rssi} iconSize={2} />
            </VStack>
          </HStack>
        </HStack>
        <Spacer />
        {pressed && (
          <Button w={80} onPress={onPress} alignItems="center">
            Pair Die
          </Button>
        )}
      </Card>
    </Pressable>
  );
}

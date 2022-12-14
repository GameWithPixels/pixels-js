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
import { ImageSourcePropType } from "react-native";

import { sr } from "../utils";
import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

/**
 * Die information to be used in dice info components.
 */
export interface PixelInfo {
  name: string;
  rssi: number; // rssi value
  batteryLevel: number;
  ledCount: number; // number of faces(led) on the die
  firmwareDate: string; //date.toString
  profileName: string;
  pixelId: number;

  //Temporary for showing different images until 3d render
  imageRequirePath?: ImageSourcePropType;
}

/**
 * Props for components displaying dice informations.
 */
export interface PixelInfoCardProps {
  h?: number | string;
  w?: number | string;
  pixel: PixelInfo; // Die infos and values
  onPress?: (() => void) | null | undefined; // Function to be executed when pressing the die info
}
/**
 * Horizontal info card for displaying paired dice
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function PairedPixelInfoComponent({
  pixel,
  onPress,
}: PixelInfoCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={100} w="100%" h={110}>
        <HStack space={6} alignItems="center" maxW="100%" h="100%">
          <Box alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={sr(70)}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          {/* dice infos */}
          <HStack space={sr(25)} h="100%" w="100%">
            <VStack space={1} alignItems="baseline" h="100%">
              <Text flex={1} bold fontSize="lg">
                {pixel.name}
              </Text>
              <Text flex={1} fontSize="xs">
                Face up: {pixel.ledCount}
              </Text>
              <Box flex={1}>
                <BatteryLevel percentage={pixel.batteryLevel} />
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
                <RSSIStrength percentage={pixel.rssi} />
              </Box>
            </VStack>
          </HStack>
        </HStack>
      </Card>
    </Pressable>
  );
}

/**
 * Squared info card for displaying paired dice informations.
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function SquarePairedPixelInfo({
  h,
  w,
  pixel,
  onPress,
}: PixelInfoCardProps) {
  const { onOpen } = useDisclose();
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
          p={sr(7)}
          w={w}
          minH={sr(40)}
          verticalSpace={1}
          h={h}
        >
          <Text fontSize="lg" bold alignSelf="center">
            {pixel.name}
          </Text>
          <Box alignItems="center" paddingBottom={sr(2)}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={sr(70)}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          <Text isTruncated fontSize="xs">
            Profile : {pixel.profileName}
          </Text>
          <Text fontSize="xs">Face Up: {pixel.ledCount}</Text>
          <HStack space={sr(2)} w="100%">
            <Box flex={1}>
              <BatteryLevel
                _icon={{ size: "md" }}
                _text={{ fontSize: "sm" }}
                percentage={pixel.batteryLevel}
              />
            </Box>
            <Box flex={1}>
              <RSSIStrength
                _icon={{ size: "md" }}
                _text={{ fontSize: "sm" }}
                percentage={pixel.rssi}
              />
            </Box>
          </HStack>
        </Card>
      </Pressable>
    </>
  );
}

/**
 * Horizontal info card for displaying scanned unpaired dice informations.
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function ScannedPixelInfoComponent({
  pixel,
  onPress,
}: PixelInfoCardProps) {
  const [pressed, setPressed] = React.useState(false);
  const [height, setHeight] = React.useState(100);
  return (
    <Pressable
      onPress={() => {
        setHeight(180);
        setPressed(true);
      }}
    >
      <Card borderWidth={1.5} w="100%" h={sr(height)} alignItems="center">
        <HStack space={sr(8)} alignItems="center" maxW="100%">
          <Box alignItems="center" flex={1}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={sr(60)}
              source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          {/* dice infos */}
          <HStack alignItems="baseline" flex={2}>
            <VStack space={sr(2)}>
              <Text fontSize="md" bold>
                {pixel.name}
              </Text>
              <Text fontSize="xs">Face Up: {pixel.ledCount} </Text>
            </VStack>
            <Spacer />
            <VStack space={2} paddingRight={sr(5)}>
              <BatteryLevel percentage={pixel.batteryLevel} />
              <RSSIStrength percentage={pixel.rssi} />
            </VStack>
          </HStack>
        </HStack>
        <Spacer />
        {pressed && (
          <Button w={sr(300)} onPress={onPress} alignItems="center">
            Pair Die
          </Button>
        )}
      </Card>
    </Pressable>
  );
}

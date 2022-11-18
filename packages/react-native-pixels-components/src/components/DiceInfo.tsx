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
  onPress?: (() => void) | null | undefined;
}

export function PairedPixelInfoComponent({ pixel, onPress }: PixelInfoProps) {
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={350} maxW={350} h={110}>
        <HStack space={6} alignItems="center" maxW="100%">
          <Box alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size="10"
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
            <VStack space={1} alignItems="baseline" maxW={150}>
              <Text fontSize="2xs">
                Firmware : {pixel.firmwareDate.toDateString()}
              </Text>
              <Text isTruncated fontSize="xs">
                Profile : {pixel.profileName}
              </Text>
              <RSSIStrength iconSize="2xl" percentage={pixel.rssi} />
            </VStack>
          </HStack>
        </HStack>
      </Card>
    </Pressable>
  );
}

export function SquarePairedPixelInfo({ pixel, onPress }: PixelInfoProps) {
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
          minW={165}
          maxW={165}
          minH="40"
          verticalSpace={1}
        >
          <Text bold alignSelf="center">
            {pixel.name}
          </Text>
          <Box alignItems="center" paddingBottom={2}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={65}
              source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              alt="placeHolder"
            />
          </Box>
          <Text isTruncated fontSize="xs">
            Profile : {pixel.profileName}
          </Text>
          <Text fontSize="xs">Face {pixel.ledCount} is up</Text>
          <HStack space={2}>
            <BatteryLevel percentage={pixel.batteryLevel} />
            <RSSIStrength percentage={pixel.rssi} />
          </HStack>
        </Card>
      </Pressable>

      {/* Pixel Details menu */}
      {/* <Modal isOpen={isOpen} onClose={onClose}>
        <Modal.Content w="90%" h="100%">
          <Modal.CloseButton />
          <Modal.Header>
            <Text bold fontSize="xl">
              {pixel.name}
            </Text>
          </Modal.Header>
          <Modal.Body>
            <Center h={400} bg="gray.700">
              <Text>test</Text>
            </Center>
          </Modal.Body>
        </Modal.Content>
      </Modal> */}
    </>
  );
}

export function ScannedPixelInfoComponent({ pixel, onPress }: PixelInfoProps) {
  const [pressed, SetPressed] = React.useState(false);
  const [height, SetHeight] = React.useState("100px");
  return (
    <Pressable
      onPress={() => {
        SetHeight("180px");
        SetPressed(true);
      }}
    >
      <Card
        borderWidth={1.5}
        maxW="100%"
        minH="100%"
        w={350}
        h={height}
        alignItems="center"
      >
        <HStack space={8} alignItems="center" maxW="100%">
          <Box alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size="10"
              source={require("../../../../apps/pixels-app/assets/UI_Icons/D10.png")}
              alt="placeHolder"
            />
          </Box>
          {/* dice infos */}
          <HStack space={5} alignItems="baseline">
            <VStack space={2}>
              <Text bold>{pixel.name}</Text>
              <Text fontSize="xs">Face {pixel.ledCount} is up </Text>
            </VStack>
            <VStack space={2}>
              <BatteryLevel percentage={pixel.batteryLevel} iconSize="2xl" />
              <RSSIStrength percentage={pixel.rssi} iconSize="2xl" />
            </VStack>
          </HStack>
        </HStack>
        <Spacer />
        {pressed ? (
          <Button onPress={onPress}>Pair Pixel</Button>
        ) : (
          <Text> </Text>
        )}
      </Card>
    </Pressable>
  );
}

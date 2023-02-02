import {
  AnimationBits,
  AnimationPreset,
  AnimationRainbow,
  Constants,
} from "@systemic-games/pixels-edit-animation";
import { Card } from "@systemic-games/react-native-base-components";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
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

import { sr } from "../utils";
import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

/**
 * Props for components displaying dice information.
 */
export interface PixelInfoCardProps {
  h?: number | string;
  w?: number | string;
  pixel: ScannedPixel;
  onPress?: () => void;
  dieRenderer: (anim: AnimationPreset, bits: AnimationBits) => React.ReactNode;
}
/**
 * Horizontal info card for displaying paired dice
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function PairedPixelInfoComponent({
  pixel,
  onPress,
  dieRenderer,
}: PixelInfoCardProps) {
  const animData = React.useMemo(() => {
    const animation = new AnimationRainbow();
    animation.duration = 10000;
    animation.count = 1;
    animation.traveling = true;
    animation.faceMask = Constants.faceMaskAllLEDs;
    const bits = new AnimationBits();
    return { animation, bits };
  }, []);
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={100} w="100%" h={110}>
        <HStack space={6} alignItems="center" maxW="100%" h="100%">
          <Box alignItems="center">
            <Box h={sr(70)} w={sr(70)}>
              {dieRenderer(animData.animation, animData.bits)}
            </Box>
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
                Firmware: {pixel.firmwareDate.toLocaleDateString()}
              </Text>
              <Text flex={1} isTruncated fontSize="xs">
                Profile: Unknown
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
 * Squared info card for displaying paired dice information.
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
              // source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </Box>
          <Text isTruncated fontSize="xs">
            Profile: Unknown
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
 * Horizontal info card for displaying scanned unpaired dice information.
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function ScannedPixelInfoComponent({
  pixel,
  onPress,
  dieRenderer,
}: PixelInfoCardProps) {
  const [pressed, setPressed] = React.useState(false);
  const [height, setHeight] = React.useState(100);
  const animData = React.useMemo(() => {
    const animation = new AnimationRainbow();
    animation.duration = 10000;
    animation.count = 1;
    animation.traveling = true;
    animation.faceMask = Constants.faceMaskAllLEDs;
    const bits = new AnimationBits();
    return { animation, bits };
  }, []);

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
            <Box h={sr(60)} w={sr(60)}>
              {dieRenderer(animData.animation, animData.bits)}
            </Box>
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

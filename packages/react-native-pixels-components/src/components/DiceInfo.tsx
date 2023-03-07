import {
  Card,
  FastBox,
  FastButton,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Text, Image, Pressable, Spacer } from "native-base";
import React from "react";

import { sr } from "../utils";
import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

export interface PixelInfo {
  readonly name: string;
  readonly ledCount: number;
  readonly firmwareDate: Date;
  readonly rssi: number;
  readonly batteryLevel: number; // Percentage
  readonly isCharging: boolean;
  readonly currentFace: number; // Face value (not index)
}

/**
 * Props for components displaying dice information.
 */
export interface PixelInfoCardProps {
  h?: number | string;
  w?: number | string;
  pixel: PixelInfo;
  profileName?: string;
  onPress?: () => void;
  dieRenderer?: () => React.ReactNode;
}
/**
 * Horizontal info card for displaying paired dice
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function PairedPixelInfoComponent({
  pixel,
  profileName,
  onPress,
  dieRenderer,
}: PixelInfoCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={100} w="100%" h={110}>
        <FastHStack alignItems="center" maxW="100%" h="100%">
          {/* Die render */}
          {dieRenderer && (
            <FastBox h={sr(70)} w={sr(70)}>
              {dieRenderer()}
            </FastBox>
          )}
          {/* Pixel info */}
          <FastVStack ml={10} alignItems="baseline" h="100%">
            <Text flex={1} bold fontSize="lg">
              {pixel.name}
            </Text>
            <Text mt={1} flex={1} fontSize="xs">
              Face up: {pixel.ledCount}
            </Text>
            <FastBox mt={1} flex={1}>
              <BatteryLevel
                percentage={pixel.batteryLevel}
                isCharging={pixel.isCharging}
              />
            </FastBox>
          </FastVStack>
          <FastVStack ml={10} alignItems="baseline" h="100%">
            <Text flex={1} fontSize="2xs" isTruncated>
              Firmware: {pixel.firmwareDate.toLocaleDateString()}
            </Text>
            <Text mt={1} flex={1} isTruncated fontSize="xs">
              Profile: {profileName}
            </Text>
            <FastBox mt={1} flex={1}>
              <RSSIStrength percentage={pixel.rssi} />
            </FastBox>
          </FastVStack>
        </FastHStack>
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
          h={h}
        >
          <Text fontSize="lg" bold alignSelf="center">
            {pixel.name}
          </Text>
          <FastBox mt={1} alignItems="center" pb={sr(2)}>
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={sr(70)}
              // source={pixel.imageRequirePath}
              alt="placeHolder"
            />
          </FastBox>
          <Text mt={1} isTruncated fontSize="xs">
            Profile: Unknown
          </Text>
          <Text mt={1} fontSize="xs">
            Face Up: {pixel.ledCount}
          </Text>
          <FastHStack mt={1} w="100%">
            <FastBox flex={1}>
              <BatteryLevel
                _icon={{ size: "md" }}
                _text={{ fontSize: "sm" }}
                percentage={pixel.batteryLevel}
                isCharging={pixel.isCharging}
              />
            </FastBox>
            <FastBox ml={1} flex={1}>
              <RSSIStrength
                _icon={{ size: "md" }}
                _text={{ fontSize: "sm" }}
                percentage={pixel.rssi}
              />
            </FastBox>
          </FastHStack>
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

  return (
    <Pressable
      onPress={() => {
        setHeight(180);
        setPressed(true);
      }}
    >
      <Card borderWidth={1.5} w="100%" h={sr(height)} alignItems="center">
        <FastHStack alignItems="center" maxW="100%">
          {dieRenderer && (
            <FastBox h={sr(60)} w={sr(60)}>
              {dieRenderer()}
            </FastBox>
          )}
          {/* dice infos */}
          <FastHStack ml={4} alignItems="baseline" flex={2}>
            <FastVStack flexGrow={1}>
              <Text fontSize="md" bold>
                {pixel.name}
              </Text>
              <Text mt={1} fontSize="xs">
                Face Up: {pixel.ledCount}{" "}
              </Text>
            </FastVStack>
            <FastVStack mr={sr(5)}>
              <BatteryLevel
                mt={2}
                percentage={pixel.batteryLevel}
                isCharging={pixel.isCharging}
              />
              <RSSIStrength mt={2} percentage={pixel.rssi} />
            </FastVStack>
          </FastHStack>
        </FastHStack>
        <Spacer />
        {pressed && (
          <FastButton w={sr(300)} onPress={onPress}>
            Pair Die
          </FastButton>
        )}
      </Card>
    </Pressable>
  );
}

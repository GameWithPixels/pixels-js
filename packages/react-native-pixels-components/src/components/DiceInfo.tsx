import {
  Card,
  CardProps,
  FastBox,
  FastButton,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { Text, Image, Pressable } from "native-base";
import React from "react";

import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";
import { sr } from "../utils";

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
export interface PixelInfoCardProps extends CardProps {
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
  ...cardProps
}: PixelInfoCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card borderWidth={1.5} minW={100} w="100%" h={110} {...cardProps}>
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
  pixel,
  onPress,
  ...cardProps
}: PixelInfoCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card
        paddingTop={0}
        borderWidth={1}
        p={sr(7)}
        minH={sr(40)}
        {...cardProps}
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
              _icon={iconStyle}
              _text={textStyle}
              percentage={pixel.batteryLevel}
              isCharging={pixel.isCharging}
            />
          </FastBox>
          <FastBox ml={1} flex={1}>
            <RSSIStrength
              _icon={iconStyle}
              _text={textStyle}
              percentage={pixel.rssi}
            />
          </FastBox>
        </FastHStack>
      </Card>
    </Pressable>
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
  ...flexProps
}: PixelInfoCardProps) {
  const [unfolded, setUnfolded] = React.useState(false);
  const [height, setHeight] = React.useState(100);
  const onToggle = React.useCallback(() => {
    setHeight(180);
    setUnfolded((b) => !b);
  }, []);
  return (
    <Pressable onPress={onToggle}>
      <Card
        borderWidth={1.5}
        w="100%"
        h={sr(height)}
        alignItems="center"
        {...flexProps}
      >
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
        {unfolded && (
          <FastButton w={sr(300)} onPress={onPress}>
            Pair Die
          </FastButton>
        )}
      </Card>
    </Pressable>
  );
}

const iconStyle = { size: "md" };
const textStyle = { fontSize: "sm" };

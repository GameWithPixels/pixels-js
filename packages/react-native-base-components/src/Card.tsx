import { VStack, useColorModeValue, Box } from "native-base";
import React from "react";

export interface CardProps {
  children?: JSX.Element | JSX.Element[];
  borderWidth?: number;
  minWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  Vspace?: number;
}

export function Card({
  children,
  borderWidth = 1,
  minWidth = 200,
  minHeight = 100,
  maxHeight,
  Vspace = 1,
}: CardProps) {
  return (
    <Box alignItems="center">
      <Box
        rounded="lg"
        minW={minWidth}
        maxW="100%"
        maxH={maxHeight}
        minH={minHeight}
        bg={useColorModeValue(
          "PixelColors.boxBGLight",
          "PixelColors.softBlack"
        )}
        borderColor="PixelColors.purple"
        borderWidth={borderWidth}
        p="4"
        shadow={1}
      >
        <VStack space={Vspace}>{children}</VStack>
      </Box>
    </Box>
  );
}

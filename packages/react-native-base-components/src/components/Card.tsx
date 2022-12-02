import {
  VStack,
  Box,
  Center,
  IContainerProps,
  usePropsResolution,
} from "native-base";
import React from "react";

export interface CardProps extends IContainerProps {
  borderWidth?: number;
  verticalSpace?: number;
}
//TO DO remove minh minw and test if there is problemes
export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props) as CardProps;
  return (
    <Center>
      <Box {...resolvedProps} rounded={resolvedProps.rounded}>
        <VStack space={resolvedProps.verticalSpace} alignItems="center">
          {resolvedProps.children}
        </VStack>
      </Box>
    </Center>
  );
}

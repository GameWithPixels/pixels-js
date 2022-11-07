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

export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props) as CardProps;
  return (
    <Center>
      <Box {...resolvedProps} rounded={resolvedProps.rounded} maxW="100%">
        <VStack space={resolvedProps.verticalSpace}>
          {resolvedProps.children}
        </VStack>
      </Box>
    </Center>
  );
}

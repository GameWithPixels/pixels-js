import {
  VStack,
  Box,
  Center,
  IContainerProps,
  usePropsResolution,
} from "native-base";
import React from "react";

interface CardProps extends IContainerProps {
  borderWidth?: number;
  verticalSpace?: number;
}

export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props);
  return (
    <Center>
      <Box {...resolvedProps} rounded={resolvedProps.rounded} maxW="100%" p="4">
        <VStack space={resolvedProps.verticalSpace}>
          {resolvedProps.children}
        </VStack>
      </Box>
    </Center>
  );
}

import {
  VStack,
  Box,
  Center,
  IContainerProps,
  usePropsResolution,
} from "native-base";
import React from "react";

interface CardProps extends IContainerProps {
  children?: JSX.Element | JSX.Element[];
  borderWidth?: number;
  Vspace?: number;
}

// TODO name props like native base: minW, maxW, etc.
// Also I wonder if we should just define a style with rounded corners
export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("BaseCard", props);
  //console.log(resolvedProps.rounded);
  return (
    <Center>
      <Box
        {...resolvedProps}
        rounded={resolvedProps.rounded}
        minW={resolvedProps.minW}
        maxW="100%"
        maxH={resolvedProps.maxH}
        minH={resolvedProps.minH}
        bg={resolvedProps.bg}
        borderColor={resolvedProps.borderColor}
        borderWidth={resolvedProps.borderWidth}
        p="4"
      >
        <VStack space={resolvedProps.Vspace}>{resolvedProps.children}</VStack>
      </Box>
    </Center>
  );
}

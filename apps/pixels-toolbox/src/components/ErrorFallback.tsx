import { FastButton } from "@systemic-games/react-native-base-components";
import { Center, Text } from "native-base";
import { FallbackProps } from "react-error-boundary";

export default function ({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Center bg="red.500" m="5%" borderRadius="xl">
      <Text bold>Error!</Text>
      <Text bold>{error.message}</Text>
      <FastButton onPress={resetErrorBoundary}>Continue</FastButton>
    </Center>
  );
}

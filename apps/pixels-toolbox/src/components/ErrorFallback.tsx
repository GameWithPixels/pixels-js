import { Button, Center, Text } from "native-base";
import { FallbackProps } from "react-error-boundary";

export default function ({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Center bg="red.500" m="5%" borderRadius="xl">
      <Text bold>Error!</Text>
      <Text bold>{error.message}</Text>
      <Button onPress={resetErrorBoundary}>Continue</Button>
    </Center>
  );
}

import { Box, HStack, IconButton, Text } from "native-base";

export function HeaderBar() {
  return (
    <Box width="100%" bg="black">
      <HStack>
        <IconButton />
        <Text>Title</Text>
      </HStack>
    </Box>
  );
}

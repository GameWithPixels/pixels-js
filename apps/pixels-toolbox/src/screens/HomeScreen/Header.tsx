import Constants from "expo-constants";
import { Center, HStack, HamburgerIcon, Pressable, Text } from "native-base";
import { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function HeaderImpl({ onPress }: { onPress?: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <HStack mt={top}>
      <Pressable width={50} height={50} onPress={onPress}>
        <HamburgerIcon size="100%" />
      </Pressable>
      <Center flex={1}>
        <Text variant="h1">
          {`Toolbox ${__DEV__ ? " 🚧" : Constants.manifest?.version}`}
        </Text>
      </Center>
    </HStack>
  );
}

export default memo(HeaderImpl);

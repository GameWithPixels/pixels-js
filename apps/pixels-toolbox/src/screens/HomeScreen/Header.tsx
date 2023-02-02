import Constants from "expo-constants";
import { HamburgerIcon, Pressable, Text } from "native-base";
import { memo } from "react";

function HeaderImpl({ navigation }: { navigation: { openDrawer(): void } }) {
  return (
    <>
      <Pressable width={50} height={50} onPress={() => navigation.openDrawer()}>
        <HamburgerIcon size="100%" />
      </Pressable>
      <Text variant="h1">
        {`Toolbox ${Constants.manifest?.version}`}
        {__DEV__ ? " 🚧" : ""}
      </Text>
    </>
  );
}

export default memo(HeaderImpl);

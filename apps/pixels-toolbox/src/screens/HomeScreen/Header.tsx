import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { HamburgerIcon, Pressable, Text } from "native-base";
import { memo } from "react";

import { type RootScreensParamList } from "~/navigation";

function HeaderImpl() {
  const navigation =
    useNavigation<
      DrawerNavigationProp<RootScreensParamList, "HomeNavigator">
    >();
  return (
    <>
      <Pressable
        position="absolute"
        top={1}
        left={-90}
        width={50}
        height={50}
        onPress={() => navigation.openDrawer()}
      >
        <HamburgerIcon size="100%" />
      </Pressable>
      <Text variant="h1">{`Toolbox v${Constants.manifest?.version}`}</Text>
    </>
  );
}

export default memo(HeaderImpl);

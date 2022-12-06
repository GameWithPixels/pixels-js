import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Center, Divider, HamburgerIcon, Menu, Pressable } from "native-base";
import { useTranslation } from "react-i18next";

import { type RootStackParamList } from "~/navigation";

export default function () {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Home">>();
  const { t } = useTranslation();
  return (
    <Menu
      // TODO see variant "cardWithBorder"
      borderRadius="xl"
      borderWidth="1"
      _dark={{
        backgroundColor: "coolGray.800",
        borderColor: "warmGray.500",
      }}
      _light={{
        backgroundColor: "warmGray.100",
        borderColor: "coolGray.400",
      }}
      trigger={(triggerProps) => {
        return (
          <Pressable
            accessibilityLabel="More options menu"
            width="100%"
            height="100%"
            {...triggerProps}
          >
            <Center width="100%" height="100%">
              <HamburgerIcon size="100%" />
            </Center>
          </Pressable>
        );
      }}
    >
      <Menu.Item onPress={() => navigation.navigate("Validation")}>
        {t("factoryValidation")}
      </Menu.Item>
      <Divider />
      <Menu.Item onPress={() => navigation.navigate("Roll")}>
        {t("rollDemo")}
      </Menu.Item>
      <Divider />
      <Menu.Item onPress={() => navigation.navigate("Animations")}>
        {t("animationsEditor")}
      </Menu.Item>
      <Divider />
      <Menu.Item onPress={() => navigation.navigate("DiceRenderer")}>
        {t("diceRenderer")}
      </Menu.Item>
    </Menu>
  );
}

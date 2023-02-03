import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import Header from "./HomeScreen/Header";

import { type HomeScreensParamList } from "~/navigation";
import DieDetailsScreen from "~/screens/DieDetailsScreen";
import HomeScreen from "~/screens/HomeScreen";
import SelectDfuFilesScreen from "~/screens/SelectDfuFilesScreen";

const Stack = createStackNavigator<HomeScreensParamList>();

export default function () {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => {
          return {
            header: () => <Header navigation={navigation} />,
          };
        }}
      />
      <Stack.Screen
        name="SelectDfuFiles"
        component={SelectDfuFilesScreen}
        options={{ title: t("selectFirmware") }}
      />
      <Stack.Screen name="DieDetails" component={DieDetailsScreen} />
    </Stack.Navigator>
  );
}

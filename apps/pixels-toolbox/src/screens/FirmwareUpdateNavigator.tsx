import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import FirmwareUpdate from "./FirmwareUpdateScreen";

import { type FirmwareUpdateParamList } from "~/navigation";
import SelectDfuFilesScreen from "~/screens/SelectDfuFilesScreen";

const Stack = createStackNavigator<FirmwareUpdateParamList>();

export default function () {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FirmwareUpdate" component={FirmwareUpdate} />
      <Stack.Screen
        name="SelectDfuFiles"
        component={SelectDfuFilesScreen}
        options={{ title: t("selectFirmware") }}
      />
    </Stack.Navigator>
  );
}

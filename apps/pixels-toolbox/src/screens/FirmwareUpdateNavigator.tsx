import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import { type FirmwareUpdateParamList } from "~/navigation";
import { FirmwareUpdateScreen } from "~/screens/FirmwareUpdateScreen";
import { SelectDfuFilesScreen } from "~/screens/SelectDfuFilesScreen";

const Stack = createStackNavigator<FirmwareUpdateParamList>();

export function FirmwareUpdateNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FirmwareUpdate" component={FirmwareUpdateScreen} />
      <Stack.Screen
        name="SelectDfuFiles"
        component={SelectDfuFilesScreen}
        options={{ title: t("selectFirmware") }}
      />
    </Stack.Navigator>
  );
}

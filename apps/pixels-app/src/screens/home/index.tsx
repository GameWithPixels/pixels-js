import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { DiceListScreen } from "./DiceListScreen";
import { DiceRollerScreen } from "./DiceRollerScreen";
import { DieDetailsScreen } from "./DieDetailsScreen";
import { DieFocusScreen } from "./DieFocusScreen";
import { EditDieProfileStack } from "./EditDieProfileStack";
import { FirmwareUpdateScreen } from "./FirmwareUpdateScreen";
import { RollsHistoryScreen } from "./RollsHistoryScreen";

import { PairedDie } from "~/app/PairedDie";
import { NavigationRoot } from "~/components/NavigationRoot";
import { PixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { SelectedPairedDieContext } from "~/hooks";
import {
  getStackNavigationOptions,
  HomeStackParamList,
  HomeStackProps,
} from "~/navigation";

const Stack = createNativeStackNavigator<HomeStackParamList>();

function SelectedPairedDieProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pairedDie, setPairedDie] = React.useState<PairedDie>();
  return (
    <SelectedPairedDieContext.Provider value={{ pairedDie, setPairedDie }}>
      {children}
    </SelectedPairedDieContext.Provider>
  );
}

export function HomeStack({ route }: HomeStackProps) {
  return (
    <SelectedPairedDieProvider>
      <NavigationRoot screenName={route.name}>
        <Stack.Navigator screenOptions={getStackNavigationOptions()}>
          <Stack.Screen name="diceList" component={DiceListScreen} />
          <Stack.Screen
            name="dieFocus"
            component={DieFocusScreen}
            options={getStackNavigationOptions("bottom-sheet")}
          />
          <Stack.Screen
            name="dieDetails"
            component={DieDetailsScreen}
            options={getStackNavigationOptions("bottom-sheet")}
          />
          <Stack.Screen
            name="dieRollsHistory"
            component={RollsHistoryScreen}
            options={getStackNavigationOptions("bottom-sheet")}
          />
          <Stack.Screen
            name="editDieProfileStack"
            component={EditDieProfileStack}
            options={getStackNavigationOptions("bottom-sheet")}
          />
          <Stack.Screen
            name="firmwareUpdate"
            component={FirmwareUpdateScreen}
            options={{
              ...getStackNavigationOptions("bottom-sheet"),
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="diceRoller"
            component={DiceRollerScreen}
            options={{
              ...getStackNavigationOptions("bottom-sheet"),
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
        <PixelTransferProgressBar
          style={{
            width: "100%",
            height: 5,
            position: "absolute",
          }}
        />
      </NavigationRoot>
    </SelectedPairedDieProvider>
  );
}

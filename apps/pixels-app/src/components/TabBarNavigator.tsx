import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, Theme, themeTools } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

import { RootStackParamList } from "~/Navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

// const ScreenOptions = (route: any, color: any) => {
//   let imageRequirePath;
//   let imageColor;
//   let imageSize;
//   let labelColor;

//   switch (route.name) {
//     case "Patterns":
//       imageRequirePath = require("../../assets/UI_Icons/pixels-fill.png");
//       imageColor = "pixelColors.green";
//       labelColor = "pixelColors.green";
//       imageSize = 9;
//       break;
//     case "Dice Bag":
//       imageRequirePath = require("../../assets/UI_Icons/D10.png");
//       imageColor = "pixelColors.red";
//       labelColor = "pixelColors.red";
//       imageSize = 8;
//       break;
//     case "Profiles":
//       imageRequirePath = require("../../assets/UI_Icons/id-card.png");
//       imageColor = "pixelColors.purple";
//       labelColor = "pixelColors.purple";
//       imageSize = 9;
//       break;
//     case "Settings":
//       imageRequirePath = require("../../assets/UI_Icons/diagram.png");
//       imageColor = "pixelColors.yellow";
//       labelColor = "pixelColors.yellow";
//       imageSize = 8;
//       break;
//   }

//   return (
//     <Image
//       alt={imageColor}
//       source={imageRequirePath}
//       tintColor={imageColor}
//       size={imageSize}
//     />
//   );
// };

/**
 * Data and props of a TabBar item that will be displayed inside the tab bar component.
 * @param screen See {@link ScreenItem} for details about this specific parameter.
 */
export interface TabBarItem {
  screen: ScreenItem;
  imageRequirePath: ImageSourcePropType;
  TabSelectedColor?: ColorType;
  iconSize?: number | SizeType;
  TabUnselectedColor?: ColorType;
}
/**
 * Data for a screen component inside the tab navigator.
 */
export interface ScreenItem {
  name: keyof RootStackParamList;
  component: React.ComponentType;
}
/**
 * Props for TabBarComponent.
 * @param items See {@link TabBarItem} for details about this specific parameter
 */
interface TabBarNavigatorProps {
  theme: Theme;
  height?: number;
  tabBackgroundColor?: ColorType;
  items?: TabBarItem[];
}

/**
 * Bottom Tab Bar navigator for navigating trough app and main screens.
 * @param props See {@link TabBarNavigatorProps} for props parameters.
 * @returns a bottom Tab bar navigator with icons and labels for each main screen.
 */
export function TabBarNavigator({
  height,
  tabBackgroundColor,
  items,
  theme,
}: TabBarNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: tabBackgroundColor
            ? themeTools.getColor(theme, tabBackgroundColor.toString())
            : "black",
          height,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      {items?.map((itemInfo, key) => (
        <Tab.Screen
          key={key}
          name={itemInfo.screen.name}
          component={itemInfo.screen.component}
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image
                alt="item"
                source={itemInfo.imageRequirePath}
                tintColor={focused ? itemInfo.TabSelectedColor : "gray.500"}
                size={itemInfo.iconSize}
              />
            ),
            tabBarActiveTintColor: itemInfo.TabSelectedColor
              ? themeTools.getColor(theme, itemInfo.TabSelectedColor.toString())
              : null,
            tabBarInactiveTintColor: themeTools.getColor(theme, "gray.500"),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, Theme, themeTools } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

import { RootStackParamList } from "~/navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

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

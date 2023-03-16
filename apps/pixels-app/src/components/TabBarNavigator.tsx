import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { IImageProps, Image, Theme, themeTools } from "native-base";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

import { RootStackParamList } from "~/navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

/**
 * Data for a screen component inside the tab navigator.
 */
export interface ScreenItem {
  name: keyof RootStackParamList;
  component: React.ComponentType;
}

/**
 * Data and props of a TabBar item that will be displayed inside the tab bar component.
 * @param screen See {@link ScreenItem} for details about this specific parameter.
 */
export interface TabBarItem {
  screen: ScreenItem;
  imageRequirePath: ImageSourcePropType;
  selectedColor?: IImageProps["tintColor"];
  iconSize?: IImageProps["size"];
}

/**
 * Props for TabBarComponent.
 * @param items See {@link TabBarItem} for details about this specific parameter
 */
interface TabBarNavigatorProps {
  theme: Theme;
  height?: number;
  tabBackgroundColor?: IImageProps["tintColor"];
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
        // headerShown: false, // This option causes a flicker, instead we're giving it an empty header component
        header: () => <></>,
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
                tintColor={focused ? itemInfo.selectedColor : "gray.500"}
                size={itemInfo.iconSize}
              />
            ),
            tabBarActiveTintColor: itemInfo.selectedColor
              ? themeTools.getColor(theme, itemInfo.selectedColor.toString())
              : null,
            tabBarInactiveTintColor: themeTools.getColor(theme, "gray.500"),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

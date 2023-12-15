import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, StyleProp, View, ViewStyle } from "react-native";
import {
  MD3Theme,
  Text,
  TouchableRippleProps,
  TouchableRipple,
} from "react-native-paper";

import { makeTransparent } from "./utils";

import { RootScreenName } from "~/navigation";
import { getRootScreenTheme } from "~/themes";

function TabButton({
  label,
  icon,
  colors,
  focused,
  ...props
}: {
  label: string;
  icon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => React.ReactNode;
  colors: Pick<
    MD3Theme["colors"],
    "background" | "primary" | "secondary" | "onSurface"
  >;
  focused: boolean;
} & Omit<TouchableRippleProps, "children">) {
  const color = focused ? colors.primary : colors.onSurface;
  return (
    <TouchableRipple
      style={{
        flex: 1,
        height: 75,
      }}
      {...props}
    >
      <LinearGradient
        colors={
          focused
            ? [
                makeTransparent(colors.primary, 0),
                makeTransparent(colors.secondary, 0.06),
              ]
            : [colors.background, colors.background]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "space-around",
          backgroundColor: colors.background,
        }}
      >
        {focused && (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              width: "100%",
              height: 3,
            }}
          />
        )}
        <View style={{ flexGrow: 1, justifyContent: "center" }}>
          {icon?.({ focused, color, size: 20 })}
        </View>
        <Text style={{ color }}>{label}</Text>
      </LinearGradient>
    </TouchableRipple>
  );
}

function getDisplayProp(
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
): "flex" | "none" | undefined {
  return style && "display" in style && typeof style.display === "string" // TODO ignoring animated value
    ? style?.display
    : undefined;
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const display =
    getDisplayProp(
      descriptors[state.routes[state.index].key].options.tabBarStyle
    ) ?? "flex";
  return (
    <View style={{ flexDirection: "row", display }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isHidden = getDisplayProp(options.tabBarItemStyle) === "none";
        if (isHidden) {
          return null;
        }

        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : options.title ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate(route.name, { merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabButton
            key={index}
            label={label}
            icon={options.tabBarIcon}
            colors={getRootScreenTheme(route.name as RootScreenName).colors}
            focused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

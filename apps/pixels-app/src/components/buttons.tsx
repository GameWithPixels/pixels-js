import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleProp,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import {
  Button,
  ButtonProps,
  IconButton,
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { IconProps } from "./icons";

import AddNewIcon from "#/icons/common/fab-add-with-gradient";
import ChartColumnIcon from "#/icons/home/chart-column";
import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import SortAZIcon from "#/icons/items-view/sort-a-z";
import SortZAIcon from "#/icons/items-view/sort-z-a";
import CaretLeftIcon from "#/icons/profiles/caret-left";
import CaretRightIcon from "#/icons/profiles/caret-right";
import { withAnimated } from "~/withAnimated";

// const emptyText = "";

// export function LargeIconButton({
//   icon,
//   iconSize,
//   ...props
// }: {
//   icon: React.FC<{ size: number; color: ColorValue }>;
//   iconSize: number;
// } & Omit<ButtonProps, "icon" | "children">) {
//   const { colors } = useTheme();
//   // Trying to get around the fact that Paper's button expects a child to be displayed as text
//   return (
//     <Button
//       mode="outlined"
//       icon={() => (
//         <View style={{ paddingLeft: iconSize / 2 }}>
//           {icon({
//             size: iconSize,
//             color: props.disabled
//               ? colors.surfaceDisabled
//               : props.mode === "contained"
//                 ? colors.onPrimary
//                 : props.mode === "contained-tonal"
//                   ? colors.onSecondaryContainer
//                   : colors.onSurface,
//           })}
//         </View>
//       )}
//       {...props}
//     >
//       {emptyText}
//     </Button>
//   );
// }

// export function LargeGradientIconButton({
//   icon,
//   iconSize,
//   disabled,
//   style,
//   ...props
// }: {
//   icon: React.FC<{ size: number; color: ColorValue }>;
//   iconSize: number;
// } & Omit<ButtonProps, "icon" | "children">) {
//   const { colors, roundness } = useTheme();
//   const borderRadius = getBorderRadius(roundness);
//   return (
//     <LinearGradient
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 0 }}
//       colors={
//         disabled
//           ? [colors.surfaceDisabled, colors.surfaceDisabled]
//           : [colors.primary, colors.secondary]
//       }
//       style={{ borderRadius, overflow: "hidden" }}
//     >
//       <TouchableRipple
//         disabled={disabled}
//         style={[{ flex: 1, paddingVertical: 7, alignItems: "center" }, style]}
//         {...props}
//       >
//         {icon({ size: iconSize, color: colors.onSurface })}
//       </TouchableRipple>
//     </LinearGradient>
//   );
// }

export function TightTextButton({
  children,
  underline,
  withPrimaryColor,
  labelStyle,
  ...props
}: { underline?: boolean; withPrimaryColor?: boolean } & ButtonProps) {
  const { colors } = useTheme();
  return (
    <Button compact {...props}>
      <Text
        variant="labelSmall"
        style={[
          { color: withPrimaryColor ? colors.primary : colors.onSurface },
          underline ? { textDecorationLine: "underline" } : undefined,
          labelStyle,
        ]}
      >
        {children}
      </Text>
    </Button>
  );
}

// export function CollapseButton({
//   collapsed,
//   onToggle,
//   ...props
// }: Omit<IconButtonProps, "icon" | "onPress"> & {
//   collapsed?: boolean;
//   onToggle?: () => void;
// }) {
//   return (
//     <IconButton
//       icon={({ size, color }) => (
//         <MaterialCommunityIcons
//           name={collapsed ? "chevron-right" : "chevron-down"}
//           size={size}
//           color={color}
//         />
//       )}
//       size={16}
//       onPress={onToggle}
//       {...props}
//     />
//   );
// }

export type StatsViewMode = "bars" | "list" | "grid";

export function StatsViewModeButton({
  viewMode,
  activeMode,
  onChange,
  ...props
}: {
  viewMode: StatsViewMode;
  activeMode?: StatsViewMode;
  onChange?: (mode: StatsViewMode) => void;
} & Omit<TouchableRippleProps, "children" | "onPress">) {
  const Icon =
    viewMode === "list"
      ? ListIcon
      : viewMode === "grid"
        ? GridIcon
        : ChartColumnIcon;
  const { colors } = useTheme();
  return (
    <TouchableRipple
      onPress={onChange ? () => onChange(viewMode) : undefined}
      {...props}
    >
      <Icon
        size={16}
        color={viewMode === activeMode ? colors.primary : "#FFF"}
      />
    </TouchableRipple>
  );
}

export type SortMode = "a-z" | "z-a";

export function SortButton({
  mode,
  onChange,
  ...props
}: {
  mode: SortMode;
  onChange?: (mode: SortMode) => void;
} & Omit<TouchableRippleProps, "children" | "onPress">) {
  const Icon = mode === "a-z" ? SortAZIcon : SortZAIcon;
  return (
    <TouchableRipple
      onPress={
        onChange ? () => onChange(mode === "a-z" ? "z-a" : "a-z") : undefined
      }
      {...props}
    >
      <Icon size={16} />
    </TouchableRipple>
  );
}

export function MenuButton({
  children,
  style,
  icon,
  iconSize = 16,
  ...props
}: { iconSize?: number; icon?: () => React.ReactNode } & TouchableCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableCard
      row
      contentStyle={[
        {
          paddingHorizontal: 20,
          paddingVertical: 12,
        },
        style,
      ]}
      {...props}
    >
      <Text variant="bodyLarge">{children}</Text>
      <View style={{ flexGrow: 1 }} />
      {icon?.()}
      {iconSize > 0 && (
        <CaretRightIcon size={iconSize} color={colors.onSurface} />
      )}
    </TouchableCard>
  );
}

export function ButtonWithCarets({
  children,
  onLeftPress,
  onRightPress,
  style,
  ...props
}: {
  onLeftPress?: () => void;
  onRightPress?: () => void;
} & ViewProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: onLeftPress ? 0 : 10,
          paddingRight: onRightPress ? 0 : 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderRadius,
          borderColor: colors.outline,
        },
        style,
      ]}
      {...props}
    >
      {!!onLeftPress && (
        <IconButton icon={CaretLeftIcon} size={9} onPress={onLeftPress} />
      )}
      <Text variant="bodyLarge">{children}</Text>
      {!!onRightPress && (
        <IconButton icon={CaretRightIcon} size={9} onPress={onRightPress} />
      )}
    </View>
  );
}

export function DieFaceButton({
  face,
  selected,
  inUse,
  style,
  contentStyle,
  ...props
}: {
  face: number;
  selected?: boolean;
  inUse?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
} & Omit<TouchableRippleProps, "children" | "style">) {
  const { colors, roundness } = useTheme();
  const textColor =
    props.disabled ?? inUse ? colors.onSurfaceDisabled : colors.onSurface;
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={
        selected
          ? [colors.primary, colors.secondary]
          : props.disabled
            ? [colors.surfaceDisabled, colors.surfaceDisabled]
            : [colors.surface, colors.surface]
      }
      style={[
        {
          borderWidth: selected ? 0 : 1,
          borderRadius,
          borderColor: colors.outline,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <TouchableRipple
        style={[
          {
            margin: 2,
            borderRadius: borderRadius - 2,
            backgroundColor: colors.surface,
          },
          contentStyle,
        ]}
        {...props}
      >
        <Text
          variant="labelLarge"
          numberOfLines={1}
          style={{
            alignSelf: "center",
            textAlign: "center",
            marginVertical: 4 + (selected ? 1 : 0),
            color: textColor,
          }}
        >
          {face.toString()}
        </Text>
      </TouchableRipple>
    </LinearGradient>
  );
}

export const AnimatedGradientButton = withAnimated(GradientButton);

export function GradientButton({
  children,
  disabled,
  outline,
  style,
  contentStyle,
  labelStyle,
  ...props
}: React.PropsWithChildren<{
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}> &
  Omit<TouchableRippleProps, "children" | "style">) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={
        disabled
          ? [colors.surfaceDisabled, colors.surfaceDisabled]
          : outline
            ? [colors.surface, colors.surface]
            : [colors.primary, colors.secondary]
      }
      style={[
        {
          borderColor: colors.outline,
          borderWidth: outline ? 1 : 0,
          borderRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <TouchableRipple
        disabled={disabled}
        rippleColor={colors.onPrimary}
        style={contentStyle}
        {...props}
      >
        <Text
          variant="labelLarge"
          numberOfLines={1}
          style={[
            {
              textAlign: "center",
              marginVertical: 10,
              marginHorizontal: 24,
              color: disabled
                ? colors.onSurfaceDisabled
                : outline
                  ? colors.onSurface
                  : colors.onPrimary,
            },
            labelStyle,
          ]}
          children={children}
        />
      </TouchableRipple>
    </LinearGradient>
  );
}

export function GradientIconButton({
  disabled,
  style,
  icon,
  outline,
  contentStyle,
  ...props
}: React.PropsWithChildren<
  {
    icon: (props: { size: number; color: string }) => React.ReactNode;
    outline?: boolean;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
  } & Omit<TouchableRippleProps, "children" | "style">
>) {
  const { colors, roundness, isV3 } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  const iconSize = isV3 ? 18 : 16;
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={
        disabled
          ? [colors.surfaceDisabled, colors.surfaceDisabled]
          : outline
            ? [colors.surface, colors.surface]
            : [colors.primary, colors.secondary]
      }
      style={[
        {
          borderColor: colors.outline,
          borderWidth: outline ? 1 : 0,
          borderRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <TouchableRipple
        disabled={disabled}
        rippleColor={colors.onPrimary}
        style={[
          {
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 8,
          },
          contentStyle,
        ]}
        {...props}
      >
        {icon({ color, size: iconSize })}
      </TouchableRipple>
    </LinearGradient>
  );
}

export function OutlineButton({ style, ...props }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Button
      mode="outlined"
      textColor={colors.onSurface}
      style={[
        {
          backgroundColor: colors.surface,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function Chip({
  children,
  disabled,
  icon,
  style,
  labelStyle,
  ...props
}: {
  disabled?: boolean;
  icon?: (props: IconProps) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
} & React.PropsWithChildren<Omit<TouchableRippleProps, "children" | "style">>) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;
  return (
    <TouchableRipple
      disabled={disabled}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius,
          backgroundColor: colors.elevation.level2,
          overflow: "hidden",
        },
        style,
      ]}
      {...props}
    >
      <>
        {children && (
          <Text
            variant="labelLarge"
            numberOfLines={1}
            style={[
              {
                textAlign: "center",
                marginRight: icon ? 8 : 0,
                color,
              },
              labelStyle,
            ]}
            children={children}
          />
        )}
        {icon?.({ size: 18, color })}
      </>
    </TouchableRipple>
  );
}

export function GradientChip({
  children,
  disabled,
  outline,
  icon,
  style,
  labelStyle,
  ...props
}: React.PropsWithChildren<{
  disabled?: boolean;
  outline?: boolean;
  icon?: (props: IconProps) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}> &
  Omit<TouchableRippleProps, "children" | "style">) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={
        disabled
          ? [colors.surfaceDisabled, colors.surfaceDisabled]
          : outline
            ? [colors.surface, colors.surface]
            : [colors.primary, colors.secondary]
      }
      style={[{ borderRadius, overflow: "hidden" }, style]}
    >
      <TouchableRipple
        disabled={disabled}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16 - (outline ? 1 : 0),
          paddingVertical: 6 - (outline ? 1 : 0),
          borderColor: colors.outline,
          borderWidth: outline ? 1 : 0,
          borderRadius,
        }}
        {...props}
      >
        <>
          <Text
            variant="labelLarge"
            numberOfLines={1}
            style={[
              {
                textAlign: "center",
                marginRight: icon ? 8 : 0,
                color,
              },
              labelStyle,
            ]}
            children={children}
          />
          {icon?.({ size: 18, color })}
        </>
      </TouchableRipple>
    </LinearGradient>
  );
}

export function FloatingAddButton({
  disabled,
  bottomInset,
  ...props
}: { bottomInset?: number } & TextProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        position: "absolute",
        bottom: 20 + (bottomInset ?? 0),
        right: 10,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <AddNewIcon
        disabled={disabled}
        color1={colors.primary}
        color2={colors.secondary}
        size={60}
        {...props}
      />
    </View>
  );
}

export function SelectionButton({
  children,
  selected,
  contentStyle,
  icon,
  ...props
}: {
  iconSize?: number;
  icon?: (props: { size: number; color: string }) => React.ReactNode;
} & TouchableCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableCard
      row
      contentStyle={[
        {
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.backdrop,
          borderColor: colors.outlineVariant,
        },
        contentStyle,
      ]}
      {...props}
    >
      {/* We need this extra view to get around some extra right padding
      that is added when the touchable is pressed */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        {icon?.({ size: 20, color: colors.onSurface })}
        <View style={{ flex: 1, flexGrow: 1 }}>
          {typeof children === "string" ? (
            <Text variant="bodyLarge" style={{ color: colors.onSurface }}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
        {selected && (
          <MaterialIcons name="check" size={24} color={colors.onSurface} />
        )}
      </View>
    </TouchableCard>
  );
}

export function AddDieButton({ contentStyle, ...props }: TouchableCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableCard
      contentStyle={[
        {
          alignItems: "center",
          justifyContent: "center",
        },
        contentStyle,
      ]}
      {...props}
    >
      <View style={{ width: 54, height: 54 }}>
        <MaterialIcons name="add" size={40} color={colors.onSurfaceVariant} />
        <MaterialCommunityIcons
          name="dice-multiple-outline"
          size={28}
          color={colors.onSurfaceVariant}
          style={{ position: "absolute", right: 0, bottom: 0 }}
        />
      </View>
    </TouchableCard>
  );
}

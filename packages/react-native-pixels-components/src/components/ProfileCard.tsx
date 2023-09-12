import { AntDesign, Foundation } from "@expo/vector-icons";
import {
  BaseStyles,
  BaseButton,
  BaseHStack,
  BaseVStack,
  FrameProps,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

/**
 * Basic profile information for minimal display.
 */
export interface ProfileInfo {
  profileName: string;
  profileKey?: number;
  profileWithSound?: boolean;
  category?: string;
}

/**
 * Props for selectable and pressable profile cards
 */
export interface ProfileCardProps extends FrameProps {
  name: string;
  description?: string;
  hasSound?: boolean;
  hasWebRequest?: boolean;
  dieRenderer?: () => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
  smallLabel?: boolean;
  infoGap?: FlexStyle["gap"];
  onPress?: () => void;
  highlighted?: boolean;
}

/**
 * A pressable profile card to display dice profiles
 * @param props See {@link ProfileCardProps} for props parameters
 */
export function ProfileCard({
  children,
  name,
  description,
  hasSound,
  hasWebRequest,
  dieRenderer,
  dieViewSize,
  smallLabel,
  infoGap = 10,
  onPress,
  highlighted,
  ...flexProps
}: ProfileCardProps) {
  const theme = useTheme();
  const textColor = theme.colors.onBackground;
  return (
    <BaseButton
      onPress={onPress}
      borderWidth={highlighted ? 2 : undefined}
      borderColor={theme.colors.primary}
      bg={undefined}
      alignItems="center"
      gap={10}
      {...flexProps}
    >
      <>
        {/* Die render */}
        {dieRenderer && (
          <View style={{ height: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        )}
        {/* Profile info */}
        <BaseVStack flex={1} gap={infoGap} justifyContent="center">
          <BaseHStack alignItems="center" gap={infoGap}>
            <Text variant={smallLabel ? undefined : "headlineSmall"}>
              {name}
            </Text>
            {hasSound && <AntDesign name="sound" size={24} color={textColor} />}
            {hasWebRequest && (
              <Foundation name="web" size={24} color={textColor} />
            )}
          </BaseHStack>
          {(description?.length ?? 0) > 0 && (
            <Text style={BaseStyles.italic}>{description}</Text>
          )}
        </BaseVStack>
        {children}
      </>
    </BaseButton>
  );
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, ViewProps } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

import { CollapsableContainer } from "./CollapsableContainer";
import { GradientButton, OutlineButton } from "./buttons";

import { AppStyles } from "~/app/styles";

export interface BannerProps extends ViewProps {
  visible?: boolean;
  title?: string;
  actionText?: string;
  altActionText?: string;
  collapsedMarginBottom?: number;
  onDismiss?: () => void;
  onAction?: () => void;
  onAltAction?: () => void;
}

export function Banner({
  children,
  visible,
  title,
  actionText,
  altActionText,
  collapsedMarginBottom,
  onDismiss,
  onAction,
  onAltAction,
  ...props
}: BannerProps) {
  return (
    <CollapsableContainer
      visible={visible}
      collapsedMarginBottom={collapsedMarginBottom}
      style={AppStyles.fullWidth}
    >
      <Card {...props}>
        <Card.Content style={{ gap: 10, paddingBottom: 15 }}>
          {title && <Text variant="titleLarge">{title}</Text>}
          {children !== undefined && children !== null && (
            <Text
              style={{ marginTop: !title && onDismiss ? 15 : 0 }}
              variant="bodyMedium"
            >
              {children}
            </Text>
          )}
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              gap: 20,
            }}
          >
            {!!actionText?.length && (
              <GradientButton
                onPress={onAction}
                style={{ flex: 1 }}
                children={actionText}
              />
            )}
            {onAltAction && (
              <OutlineButton onPress={onAltAction}>
                {altActionText}
              </OutlineButton>
            )}
          </View>
        </Card.Content>
        {onDismiss && (
          <IconButton
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="close" size={size} color={color} />
            )}
            size={20}
            sentry-label={
              "hide-banner-" +
              (title?.toLocaleLowerCase().replace(" ", "-") ?? "unnamed")
            }
            style={{ position: "absolute", right: -5, top: -5 }}
            onPress={onDismiss}
          />
        )}
      </Card>
    </CollapsableContainer>
  );
}

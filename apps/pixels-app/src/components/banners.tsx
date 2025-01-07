import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ViewProps } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

import { CollapsableContainer } from "./CollapsableContainer";
import { GradientButton } from "./buttons";

import { AppStyles } from "~/app/styles";

export interface BannerProps extends ViewProps {
  visible?: boolean;
  title?: string;
  actionText?: string;
  collapsedMarginBottom?: number;
  onDismiss?: () => void;
  onAction?: () => void;
}

export function Banner({
  children,
  visible,
  title,
  actionText,
  collapsedMarginBottom,
  onDismiss,
  onAction,
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
          {!!actionText?.length && (
            <GradientButton onPress={onAction} children={actionText} />
          )}
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

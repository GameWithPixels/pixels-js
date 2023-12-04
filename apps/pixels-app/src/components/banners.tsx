import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ViewProps } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

import { CollapsableContainer } from "./CollapsableContainer";
import { GradientButton } from "./buttons";

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
      style={{ width: "100%" }}
    >
      <Card {...props}>
        <Card.Content style={{ gap: 10, paddingBottom: 15 }}>
          {title && <Text variant="titleLarge">{title}</Text>}
          {children && (
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
            style={{ position: "absolute", right: -5, top: -5 }}
            onPress={onDismiss}
          />
        )}
      </Card>
    </CollapsableContainer>
  );
}

export function PromoBanner({
  visible,
  collapsedMarginBottom,
  onHide,
  ...props
}: {
  visible?: boolean;
  collapsedMarginBottom?: number;
  onHide: () => void;
} & Pick<BannerProps, "visible" | "collapsedMarginBottom"> &
  ViewProps) {
  return (
    <Banner
      title="New Stuff!"
      actionText="Read Update"
      visible={visible}
      collapsedMarginBottom={collapsedMarginBottom}
      onAction={() => {}}
      onDismiss={onHide}
      {...props}
    >
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum in
      malesuada leo.
    </Banner>
  );
}

export function WelcomeBanner({
  onHide,
  ...props
}: { onHide: () => void } & ViewProps) {
  return (
    <Banner
      title="Welcome! Let’s get started."
      onAction={() => {}}
      onDismiss={onHide}
      {...props}
    >
      To get started connecting your die, open your case and your die should
      appear below under “Available to Pair”.
    </Banner>
  );
}

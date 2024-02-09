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

export function NewPixelAppBanner({
  visible,
  collapsedMarginBottom,
  onHide,
  ...props
}: {
  visible?: boolean;
  collapsedMarginBottom?: number;
  onHide?: () => void;
} & Pick<BannerProps, "visible" | "collapsedMarginBottom"> &
  ViewProps) {
  return (
    <Banner
      title="The New Pixels App!"
      actionText="Hide"
      visible={visible}
      collapsedMarginBottom={collapsedMarginBottom}
      onAction={onHide}
      onDismiss={onHide}
      {...props}
    >
      We rebuilt it from scratch to make it more fun to use. Expect frequent
      updates with new features in the coming months.
    </Banner>
  );
}

export function CreateProfileBanner({
  visible,
  collapsedMarginBottom,
  ...props
}: {
  visible?: boolean;
  collapsedMarginBottom?: number;
} & Pick<BannerProps, "visible" | "collapsedMarginBottom"> &
  ViewProps) {
  return (
    <Banner
      title="Create a Profile!"
      visible={visible}
      collapsedMarginBottom={collapsedMarginBottom}
      {...props}
    >
      Try out the new profile templates 🎉
      {"\n"}
      {"\n"}
      To get started tap on the (+) button at the bottom of the page.
    </Banner>
  );
}

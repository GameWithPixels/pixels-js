import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import { Platform } from "react-native";
import { Divider, Menu, MenuProps, useTheme } from "react-native-paper";

import CalibrateIcon from "#/icons/home/calibrate";
import { AppStyles } from "~/app/styles";

export function DieMenu({
  disconnected,
  onUnpair,
  onUpdateFirmware,
  onRename,
  onCalibrate,
  onReset,
  onTurnOff,
  ...props
}: {
  disconnected?: boolean;
  onUnpair: () => void;
  onUpdateFirmware?: () => void;
  onRename?: () => void;
  onCalibrate?: () => void;
  onReset?: () => void;
  onTurnOff?: () => void;
} & Omit<MenuProps, "children" | "theme" | "containerStyle">) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <Menu
      contentStyle={{
        marginTop: Platform.select({ ios: 10, default: 0 }),
        width: 230,
      }}
      {...props}
    >
      {onUpdateFirmware && (
        <>
          <Menu.Item
            title="Update Firmware"
            style={{
              backgroundColor: colors.errorContainer,
              borderRadius,
              margin: 5,
            }}
            titleStyle={{ color: colors.onErrorContainer }}
            trailingIcon={({ size, color }) => (
              <FontAwesome5 name="download" size={size} color={color} />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onUpdateFirmware();
            }}
          />
          <Divider />
        </>
      )}
      {onRename && (
        <>
          <Menu.Item
            title="Rename"
            disabled={!!disconnected}
            trailingIcon={({ size, color }) => (
              <MaterialCommunityIcons
                name="rename-box"
                size={size}
                color={color}
              />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onRename();
            }}
          />
          <Divider />
        </>
      )}
      {onCalibrate && (
        <>
          <Menu.Item
            title="Calibrate"
            disabled={disconnected}
            trailingIcon={({ size, color }) => (
              <CalibrateIcon size={size} color={color} />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onCalibrate();
            }}
          />
          <Divider />
        </>
      )}
      {onReset && (
        <>
          <Menu.Item
            title="Reset Die Settings"
            disabled={disconnected}
            trailingIcon={({ size, color }) => (
              <Feather name="refresh-ccw" size={size} color={color} />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onReset();
            }}
          />
          <Divider />
        </>
      )}
      {onTurnOff && (
        <>
          <Menu.Item
            title="Turn Off"
            disabled={disconnected}
            trailingIcon={({ size, color }) => (
              <MaterialCommunityIcons
                name="power-standby"
                size={size}
                color={color}
              />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onTurnOff();
            }}
          />
          <Divider />
        </>
      )}
      <Menu.Item
        title="Unpair Die"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons
            name="link-variant-off"
            size={size}
            color={color}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
          onUnpair();
        }}
      />
    </Menu>
  );
}

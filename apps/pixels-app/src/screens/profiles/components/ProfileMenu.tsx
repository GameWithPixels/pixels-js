import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Divider, Menu, MenuProps, Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/styles";

export function ProfileMenu({
  onRename,
  onAdvancedOptions,
  onDelete,
  activatedDiceCount,
  ...props
}: {
  onRename?: () => void;
  onAdvancedOptions: () => void;
  onDelete?: () => void;
  activatedDiceCount?: number;
} & Omit<MenuProps, "children" | "theme" | "contentStyle">) {
  const { colors } = useTheme();
  return (
    <Menu contentStyle={{ width: 230 }} {...props}>
      {onRename ? (
        <Menu.Item
          title="Rename"
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
      ) : (
        <Menu.Item
          title="Save As New Profile"
          trailingIcon={({ size, color }) => (
            <MaterialCommunityIcons
              name="content-save-outline"
              size={size}
              color={color}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => {
            props.onDismiss?.();
          }}
        />
      )}
      <Divider />
      <Menu.Item
        title="Advanced Settings"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons
            name="cog-outline"
            size={size}
            color={color}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
          onAdvancedOptions();
        }}
      />
      {/* <Divider />
      <Menu.Item
        title="Share"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons name="share" size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
        }}
      /> */}
      {onDelete && (
        <>
          <Divider />
          <Menu.Item
            disabled={!!activatedDiceCount}
            title="Delete"
            trailingIcon={({ size, color }) => (
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={size}
                color={color}
              />
            )}
            contentStyle={AppStyles.menuItemWithIcon}
            onPress={() => {
              props.onDismiss?.();
              onDelete?.();
            }}
          />
          {!!activatedDiceCount && (
            <Text
              style={{
                marginTop: -10,
                marginHorizontal: 16,
                color: colors.onSurfaceDisabled,
              }}
            >
              Profile is activated
            </Text>
          )}
        </>
      )}
    </Menu>
  );
}

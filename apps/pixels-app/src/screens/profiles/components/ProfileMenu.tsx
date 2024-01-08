import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Divider, Menu, MenuProps } from "react-native-paper";

import { AppStyles } from "~/styles";

export function ProfileMenu({
  onRename,
  onEditAdvancedRules,
  onDelete,
  ...props
}: {
  onRename?: () => void;
  onEditAdvancedRules: () => void;
  onDelete?: () => void;
} & Omit<MenuProps, "children" | "theme" | "contentStyle">) {
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
        title="Edit Advanced Rules"
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
          onEditAdvancedRules();
        }}
      />
      <Divider />
      <Menu.Item
        title="Share"
        trailingIcon={({ size, color }) => (
          <MaterialCommunityIcons name="share" size={size} color={color} />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        onPress={() => {
          props.onDismiss?.();
        }}
      />
      {onDelete && (
        <>
          <Divider />
          <Menu.Item
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
              onDelete();
            }}
          />
        </>
      )}
    </Menu>
  );
}

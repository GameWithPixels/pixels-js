import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Divider, Menu, MenuProps } from "react-native-paper";

import { AppStyles } from "~/app/styles";

export function ProfileMenu({
  onRename,
  onAdvancedOptions,
  onDelete,
  onSaveToLibrary,
  ...props
}: {
  onRename?: () => void;
  onAdvancedOptions: () => void;
  onDelete?: () => void;
  onSaveToLibrary?: () => void;
} & Omit<MenuProps, "children" | "theme" | "contentStyle">) {
  return (
    <Menu contentStyle={{ width: 230 }} {...props}>
      {onRename && (
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
      )}
      {onSaveToLibrary && (
        <Menu.Item
          title="Save To Library"
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
            onSaveToLibrary();
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
        </>
      )}
    </Menu>
  );
}

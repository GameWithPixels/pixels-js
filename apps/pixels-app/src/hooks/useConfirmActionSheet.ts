import { useActionSheet } from "@expo/react-native-action-sheet";
import React from "react";
import { useTheme } from "react-native-paper";

export function useConfirmActionSheet<T = undefined>(
  actionName: string,
  onConfirm?: (data?: T) => void,
  opt?: {
    title?: string;
    message?: string;
    cancelActionName?: string;
    onCancel?: () => void;
  }
): (opt?: {
  // Overrides
  actionName?: string;
  onConfirm?: () => void;
  // Data
  data?: T;
}) => void {
  const { showActionSheetWithOptions } = useActionSheet();
  const { title, message, cancelActionName, onCancel } = opt ?? {};
  const { colors } = useTheme();
  return React.useCallback(
    (opt) => {
      showActionSheetWithOptions(
        {
          title,
          message,
          options: [
            opt?.actionName ?? actionName,
            cancelActionName ?? "Cancel",
          ],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          tintColor: colors.onSurface,
          destructiveColor: colors.error,
          containerStyle: { backgroundColor: colors.background },
          titleTextStyle: { color: colors.onSurfaceVariant },
          messageTextStyle: { color: colors.onSurfaceVariant },
        },
        (selectedIndex?: number) => {
          switch (selectedIndex) {
            case 0:
              (opt?.onConfirm ?? onConfirm)?.(opt?.data);
              break;
            case 1:
              onCancel?.();
              break;
          }
        }
      );
    },
    [
      showActionSheetWithOptions,
      title,
      message,
      actionName,
      cancelActionName,
      colors,
      onConfirm,
      onCancel,
    ]
  );
}

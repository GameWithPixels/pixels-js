import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "react-native-paper";

export function useConfirmActionSheet(
  actionName: string,
  onConfirm?: () => void,
  opt?: {
    title?: string;
    message?: string;
    cancelActionName?: string;
    onCancel?: () => void;
  }
): (overrides?: { actionName?: string; onConfirm?: () => void }) => void {
  const { showActionSheetWithOptions } = useActionSheet();
  const { colors } = useTheme();
  return (overrides?: { actionName?: string; onConfirm?: () => void }) => {
    showActionSheetWithOptions(
      {
        title: opt?.title,
        message: opt?.message,
        options: [
          overrides?.actionName ?? actionName,
          opt?.cancelActionName ?? "Cancel",
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
            (overrides?.onConfirm ?? onConfirm)?.();
            break;
          case 1:
            opt?.onCancel?.();
            break;
        }
      }
    );
  };
}

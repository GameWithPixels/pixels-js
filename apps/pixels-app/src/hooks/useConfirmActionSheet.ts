import { useActionSheet } from "@expo/react-native-action-sheet";
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
  const { colors } = useTheme();
  return (myOpt) => {
    showActionSheetWithOptions(
      {
        title: opt?.title,
        message: opt?.message,
        options: [
          myOpt?.actionName ?? actionName,
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
            (myOpt?.onConfirm ?? onConfirm)?.(myOpt?.data);
            break;
          case 1:
            opt?.onCancel?.();
            break;
        }
      }
    );
  };
}

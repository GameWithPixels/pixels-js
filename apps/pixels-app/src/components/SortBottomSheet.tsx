import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import { useTheme, Text, ThemeProvider, IconButton } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { SelectionButton } from "./buttons";

import { bottomSheetAnimationConfigFix } from "~/fixes";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { getBottomSheetBackgroundStyle } from "~/themes";

export type SortBottomSheetSortIcon = (props: {
  size: number;
  color: string;
}) => React.ReactNode;

// TODO type groupBy, onChangeGroupBy, sortMode, onChangeSortMode props
export function SortBottomSheet({
  groups,
  getGroupingLabel,
  groupBy,
  onChangeGroupBy,
  sortModes,
  getSortModeLabel,
  getSortModeIcon,
  sortMode,
  onChangeSortMode,
  visible,
  onDismiss,
}: {
  groups: readonly string[];
  getGroupingLabel?: (mode: string) => string;
  groupBy: string;
  onChangeGroupBy: (group: string) => void;
  sortModes: readonly string[];
  getSortModeLabel?: (mode: string) => string;
  getSortModeIcon?: (mode: string) => SortBottomSheetSortIcon;
  sortMode: string;
  onChangeSortMode: (mode: string) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={onChange}
      animationConfigs={bottomSheetAnimationConfigFix}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetScrollView
            contentContainerStyle={{ padding: 20, gap: 10 }}
          >
            <Text variant="titleMedium">Group By</Text>
            <View>
              {groups.map((g, i) => (
                <SelectionButton
                  key={g}
                  selected={groupBy === g}
                  noTopBorder={i > 0}
                  squaredTopBorder={i > 0}
                  squaredBottomBorder={i < 2}
                  onPress={() => onChangeGroupBy(g)}
                >
                  {getGroupingLabel?.(g) ?? g}
                </SelectionButton>
              ))}
            </View>
            <Text variant="titleMedium">Sort</Text>
            <View>
              {sortModes.map((s, i) => (
                <SelectionButton
                  key={s}
                  selected={sortMode === s}
                  noTopBorder={i > 0}
                  squaredTopBorder={i > 0}
                  squaredBottomBorder={i < 1}
                  icon={getSortModeIcon?.(s)}
                  onPress={() => onChangeSortMode(s)}
                >
                  {getSortModeLabel?.(s) ?? s}
                </SelectionButton>
              ))}
            </View>
          </BottomSheetScrollView>
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-sort"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={onDismiss}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

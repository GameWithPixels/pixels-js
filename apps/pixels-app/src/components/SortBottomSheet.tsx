import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import { useTheme, Text, ThemeProvider, Switch } from "react-native-paper";

import { SelectionButton } from "./buttons";

import SortAZIcon from "#/icons/items-view/sort-a-z";
import SortZAIcon from "#/icons/items-view/sort-z-a";
import { getBottomSheetBackgroundStyle } from "@/themes";

function SortByDateIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <MaterialCommunityIcons
      name="sort-calendar-descending"
      size={size}
      color={color}
    />
  );
}

export function SortBottomSheet({
  groups,
  visible,
  onDismiss,
}: {
  groups: string[];
  visible: boolean;
  onDismiss: () => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const [favOnTop, setFavOnTop] = React.useState(true);
  const [groupBy, setGroupBy] = React.useState(groups[0]);
  const [sort, setSort] = React.useState("Alphabetically");

  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={[540]}
      onDismiss={onDismiss}
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
      <ThemeProvider theme={theme}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text variant="titleMedium">Favorites On Top</Text>
            <Switch value={favOnTop} onValueChange={setFavOnTop} />
          </View>
          <Text variant="titleMedium">Group By</Text>
          <View>
            {groups.map((g, i) => (
              <SelectionButton
                key={g}
                selected={groupBy === g}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < 2}
                onPress={() => setGroupBy(g)}
              >
                {g}
              </SelectionButton>
            ))}
          </View>
          <Text variant="titleMedium">Sort</Text>
          <View>
            {["Alphabetically", "Reverse", "Date"].map((s, i) => (
              <SelectionButton
                key={s}
                selected={sort === s}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < 1}
                icon={
                  i === 0 ? SortAZIcon : i === 1 ? SortZAIcon : SortByDateIcon
                }
                onPress={() => setSort(s)}
              >
                {s}
              </SelectionButton>
            ))}
          </View>
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

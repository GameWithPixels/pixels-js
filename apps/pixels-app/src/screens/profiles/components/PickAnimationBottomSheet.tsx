import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Text, ThemeProvider, useTheme } from "react-native-paper";

import { TabsHeaders } from "~/components/TabsHeaders";
import { AnimationsGrid } from "~/components/animation";
import { androidBottomSheetSliderFix } from "~/fixes";
import { useAnimationsList, useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { getBottomSheetBackgroundStyle } from "~/themes";

const categories: Profiles.AnimationCategory[] = [
  "colorful",
  "animated",
  "flashy",
  "uniform",
  "system",
];
const tabsNames = categories.map((c) => c[0].toUpperCase() + c.slice(1));

export function PickAnimationBottomSheet({
  animation,
  dieType,
  onSelectAnimation,
  visible,
  onDismiss,
}: {
  animation?: Readonly<Profiles.Animation>;
  dieType?: PixelDieType;
  onSelectAnimation?: (animation: Readonly<Profiles.Animation>) => void;
  onDismiss: () => void;
  visible: boolean;
}) {
  const allAnimations = useAnimationsList();
  const sortedAnimations = React.useMemo(
    () =>
      tabsNames.map((_, i) =>
        allAnimations
          .filter(
            (a) =>
              a.category === categories[i] &&
              (!dieType || a.dieType === "unknown" || a.dieType === dieType)
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      ),
    [allAnimations, dieType]
  );
  const [tab, setTab] = React.useState(tabsNames[0]);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);
  const paddingBottom = useBottomSheetPadding();
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={["92%"]}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      onDismiss={onDismiss}
      onChange={onChange}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
      {...androidBottomSheetSliderFix}
    >
      <ThemeProvider theme={theme}>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom,
            gap: 10,
          }}
        >
          <Text variant="titleMedium">Select Animation</Text>
          <TabsHeaders names={tabsNames} selected={tab} onSelect={setTab} />
          <AnimationsGrid
            animations={sortedAnimations[tabsNames.indexOf(tab)]}
            dieType={dieType}
            numColumns={2}
            selected={animation}
            onSelectAnimation={onSelectAnimation}
          />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

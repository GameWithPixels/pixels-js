import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, ThemeProvider, useTheme } from "react-native-paper";

import { TabsHeaders } from "~/components/TabsHeaders";
import { AnimationsGrid } from "~/components/animation";
import { bottomSheetAnimationConfigFix } from "~/fixes";
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
          // Remove duplicates
          // TODO this will breaks once users can create custom animations
          .filter(
            (a) =>
              a.dieType !== "unknown" ||
              allAnimations.reduce(
                (acc, anim) => acc + (a.name === anim.name ? 1 : 0),
                0
              ) <= 1
          )
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
  const scrollRef = React.useRef<GHScrollView>(null);
  const paddingBottom = useBottomSheetPadding();
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={["92%"]}
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
      <ThemeProvider theme={theme}>
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 10,
            paddingBottom,
            gap: 10,
          }}
        >
          <Text variant="titleMedium">Select Animation</Text>
          <TabsHeaders
            names={tabsNames}
            selected={tab}
            onSelect={(tab) => {
              scrollRef.current?.scrollTo({ y: 0, animated: false });
              setTab(tab);
            }}
          />
          <GHScrollView ref={scrollRef} contentContainerStyle={{ gap: 10 }}>
            <AnimationsGrid
              animations={sortedAnimations[tabsNames.indexOf(tab)]}
              dieType={dieType}
              numColumns={2}
              selected={animation}
              onSelectAnimation={onSelectAnimation}
            />
          </GHScrollView>
        </BottomSheetView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

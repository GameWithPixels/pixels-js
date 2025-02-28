import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { AnimationsGrid } from "./AnimationsGrid";
import { BottomSheetModalCloseButton } from "./buttons";

import { AnimationsCategories } from "~/app/displayNames";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { TabsHeaders } from "~/components/TabsHeaders";
import { toProfileDieType } from "~/features/profiles";
import {
  useAnimationsList,
  useBottomSheetBackHandler,
  useBottomSheetPadding,
} from "~/hooks";

const categories = Object.freeze(
  Object.keys(AnimationsCategories) as Profiles.AnimationCategory[]
);
const categoriesNames = Object.freeze(
  Object.values(AnimationsCategories) as string[]
);

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
  const profileDieType = dieType ? toProfileDieType(dieType) : undefined;
  const sortedAnimations = React.useMemo(
    () =>
      categories.map((category) =>
        allAnimations
          .filter(
            (a) =>
              a.category === category &&
              (!profileDieType ||
                a.dieType === "unknown" ||
                a.dieType === profileDieType)
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
    [allAnimations, profileDieType]
  );
  const [tab, setTab] = React.useState(categories[0]);
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
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={["92%"]}
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetView
            style={{
              flex: 1,
              paddingHorizontal: 10,
              paddingBottom,
              gap: 10,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select Animation
            </Text>
            <TabsHeaders
              keys={categories}
              names={categoriesNames}
              selected={tab}
              onSelect={(tab) => {
                scrollRef.current?.scrollTo({ y: 0, animated: false });
                setTab(tab);
              }}
            />
            <GHScrollView ref={scrollRef} contentContainerStyle={{ gap: 10 }}>
              <AnimationsGrid
                animations={sortedAnimations[categories.indexOf(tab)]}
                dieType={dieType}
                numColumns={2}
                selected={animation}
                onSelectAnimation={onSelectAnimation}
              />
            </GHScrollView>
          </BottomSheetView>
          <BottomSheetModalCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}

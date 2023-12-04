import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { DiceUtils } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, Platform } from "react-native";
import { Button, Text, ThemeProvider, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AnimationOverrides,
  AnimationOverrideName,
  AnimationOverrideNames,
  EditAnimationOverrides,
  getAnimationOverrideUserName,
  createAnimationOverride,
} from "./EditAnimationOverrides";

import { FacesGrid } from "~/components/FacesGrid";
import { SliderWithValue } from "~/components/SliderWithTitle";
import { AnimationsGrid } from "~/components/animation";
import { GradientButton } from "~/components/buttons";
import { getConditionTypeLabel } from "~/descriptions";
import { useAnimations, useConfirmActionSheet } from "~/hooks";
import { ActionType, ConditionType, PixelAnimation } from "~/temp";
import { getBottomSheetBackgroundStyle } from "~/themes";

function PickAnimationModal({
  animation,
  onSelectAnimation,
  visible,
  onDismiss,
}: {
  animation?: PixelAnimation;
  onSelectAnimation?: (animation: PixelAnimation) => void;
  onDismiss: () => void;
  visible: boolean;
}) {
  const { animations } = useAnimations();
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={["92%"]}
      activeOffsetY={Platform.OS === "android" ? [-1, 1] : undefined} // For the slider
      failOffsetX={Platform.OS === "android" ? [-5, 5] : undefined} // For the slider
      backgroundStyle={getBottomSheetBackgroundStyle()}
      onDismiss={onDismiss}
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
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(10, bottom),
            gap: 10,
          }}
        >
          <Text variant="titleMedium">Select Animation</Text>
          <AnimationsGrid
            animations={animations}
            numColumns={2}
            selected={animation}
            onSelectAnimation={onSelectAnimation}
          />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
export function ConfigureAnimationModal({
  conditionType,
  actionType,
  visible,
  onDismiss,
}: {
  conditionType: ConditionType;
  actionType: ActionType;
  onDismiss: () => void;
  visible: boolean;
}) {
  const [animation, setAnimation] = React.useState<PixelAnimation>();
  const [animPickerVisible, setAnimPickerVisible] = React.useState(false);
  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);
  const showConfirmDiscard = useConfirmActionSheet(
    "Discard Changes",
    () => onDismiss(),
    {
      message: "Are you sure you want to discard your changes?",
      cancelActionName: "Keep Editing",
      onCancel: () => sheetRef.current?.present(0),
    }
  );

  const [delay, setDelay] = React.useState(5);
  const [volume, setVolume] = React.useState(50);
  const [text, setText] = React.useState("$Face");

  const theme = useTheme();
  const { colors } = theme;
  const borderRadius = getBorderRadius(theme.roundness, { tight: true });

  const [overrides, setOverrides] = React.useState<Partial<AnimationOverrides>>(
    {}
  );
  const { showActionSheetWithOptions } = useActionSheet();
  const showOverridesActionSheet = () => {
    const keys: AnimationOverrideName[] = AnimationOverrideNames.filter(
      (k) => !(k in overrides)
    );
    showActionSheetWithOptions(
      {
        message: "Select Override to Add",
        options: [...keys.map(getAnimationOverrideUserName), "Cancel"],
        cancelButtonIndex: keys.length,
        tintColor: colors.onSurface,
        containerStyle: { backgroundColor: colors.background },
        titleTextStyle: { color: colors.onSurfaceVariant },
        messageTextStyle: { color: colors.onSurfaceVariant },
      },
      (selectedIndex?: number) => {
        const key = keys[selectedIndex ?? -1];
        if (key) {
          setOverrides((overrides) => ({
            ...overrides,
            ...createAnimationOverride(key),
          }));
        }
      }
    );
  };
  const { bottom } = useSafeAreaInsets();
  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      // activeOffsetY={Platform.OS === "android" ? [-1, 1] : undefined} // For the slider
      // failOffsetX={Platform.OS === "android" ? [-5, 5] : undefined} // For the slider
      keyboardBehavior={Platform.OS === "ios" ? "interactive" : "fillParent"}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleComponent={() => (
        <ThemeProvider theme={theme}>
          <View
            style={{
              flexDirection: "row",
              paddingTop: 5,
              paddingBottom: 15,
              paddingHorizontal: 5,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              labelStyle={{ ...theme.fonts.bodySmall }}
              onPress={() => showConfirmDiscard()}
            >
              Cancel
            </Button>
            <Text variant="titleMedium">Edit Action</Text>
            <Button onPress={onDismiss}>Done</Button>
          </View>
        </ThemeProvider>
      )}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      // onAnimate={(fromIndex: number, toIndex: number) => {
      //   // Check if the sheet is visible and being pulled down
      //   // Note: we need to use a reference to the "visible" props
      //   // otherwise we don't get the latest value.
      //   if (visibleRef.current && fromIndex >= 0) {
      //     // Cancel pull down gesture and show confirmation action sheet
      //     sheetRef.current?.expand();
      //     showConfirmDiscard();
      //   }
      // }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="none"
          {...props}
        />
      )}
    >
      <ThemeProvider theme={theme}>
        <BottomSheetView
          style={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(10, bottom),
            gap: 10,
          }}
        >
          {conditionType === "rolled" && (
            <>
              <Text variant="titleMedium">When Roll is</Text>
              <FacesGrid
                faces={DiceUtils.getDieFaces("d12")}
                selected={[2, 4]}
                style={{ marginHorizontal: 10 }}
              />
            </>
          )}
          {actionType === "playAnimation" && (
            <>
              <Text variant="titleMedium">
                {conditionType === "rolled"
                  ? ""
                  : getConditionTypeLabel(conditionType) + " "}
                Play
              </Text>
              <GradientButton
                outline
                onPress={() => setAnimPickerVisible(true)}
                style={{ marginHorizontal: 10 }}
              >
                {animation ? animation.name : "Select Animation"}
              </GradientButton>
            </>
          )}
          {conditionType !== "rolled" &&
            (actionType === "playAnimation" ? (
              <>
                <Text variant="titleMedium">Recheck After</Text>
                <SliderWithValue
                  unit=" s"
                  value={delay}
                  minimumValue={1}
                  maximumValue={15}
                  step={0.1}
                  onValueChange={setDelay}
                />
              </>
            ) : actionType === "playSound" ? (
              <>
                <Text variant="titleMedium">Play</Text>
                <GradientButton outline onPress={() => {}}>
                  Select Sound File
                </GradientButton>
                <Text variant="titleMedium">Volume</Text>
                <SliderWithValue
                  unit=" %"
                  value={volume}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  onValueChange={setVolume}
                />
              </>
            ) : actionType === "textToSpeech" ? (
              <>
                <Text variant="titleMedium">Text to Read</Text>
                <BottomSheetTextInput
                  // mode="outlined"
                  // dense
                  style={{
                    color: colors.onSurfaceVariant,
                    backgroundColor: colors.elevation.level0,
                    borderWidth: 1,
                    borderRadius,
                    borderColor: colors.outline,
                  }}
                  value={text}
                  onChangeText={setText}
                />
                <GradientButton outline onPress={() => {}}>
                  Browse Texts
                </GradientButton>
                <Text variant="titleMedium">Volume</Text>
                <SliderWithValue
                  unit=" %"
                  value={volume}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  onValueChange={setVolume}
                />
              </>
            ) : actionType === "webRequest" ? (
              <>
                <Text variant="titleMedium">URL</Text>
                <BottomSheetTextInput
                  // mode="outlined"
                  // dense
                  style={{
                    color: colors.onSurfaceVariant,
                    backgroundColor: colors.elevation.level0,
                    borderWidth: 1,
                    borderRadius,
                    borderColor: colors.outline,
                  }}
                />
                <GradientButton outline onPress={() => {}}>
                  Browse Texts
                </GradientButton>
              </>
            ) : (
              <></>
            ))}
          {actionType === "playAnimation" && (
            <>
              <EditAnimationOverrides
                overrides={overrides}
                onChangeOverrides={setOverrides}
                style={{ marginLeft: 10 }}
              />
              <GradientButton
                outline
                disabled={!animation}
                onPress={showOverridesActionSheet}
                style={{
                  marginHorizontal: 10,
                  marginTop: Object.keys(overrides).length ? 10 : 0,
                }}
              >
                Add Animation Override
              </GradientButton>
            </>
          )}
        </BottomSheetView>
      </ThemeProvider>
      <PickAnimationModal
        animation={animation}
        onSelectAnimation={(anim) => {
          setAnimation(anim);
          setAnimPickerVisible(false);
        }}
        visible={animPickerVisible}
        onDismiss={() => setAnimPickerVisible(false)}
      />
    </BottomSheetModal>
  );
}

import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Platform } from "react-native";
import { Text, ThemeProvider, useTheme } from "react-native-paper";

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
import { useAnimationsList } from "~/hooks";
import { useBottomSheetPadding } from "~/hooks/useBottomSheetPadding";
import { useRolledConditionFaces } from "~/hooks/useRolledConditionFaces";
import { getBottomSheetBackgroundStyle } from "~/themes";

function PickAnimationModal({
  animation,
  onSelectAnimation,
  visible,
  onDismiss,
}: {
  animation?: Readonly<Profiles.Animation>;
  onSelectAnimation?: (animation: Readonly<Profiles.Animation>) => void;
  onDismiss: () => void;
  visible: boolean;
}) {
  const animations = useAnimationsList();
  const sheetRef = React.useRef<BottomSheetModal>(null);
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
            paddingBottom,
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

const ConfigureRolledCondition = observer(function ({
  condition,
  dieType,
  unavailableFaces,
}: {
  condition: Profiles.ConditionRolled;
  dieType: PixelDieType;
  unavailableFaces?: number[];
}) {
  const faces = useRolledConditionFaces(condition);
  return faces !== "all" ? (
    <>
      <Text variant="titleMedium">When Roll is</Text>
      <FacesGrid
        dieType={dieType}
        selected={faces}
        unavailable={unavailableFaces}
        onToggleFace={(face) =>
          runInAction(() => (condition.face ^= 1 << (face - 1)))
        }
        style={{ marginHorizontal: 10 }}
      />
    </>
  ) : null;
});

const ConfigureRollingCondition = observer(function ({
  condition,
}: {
  condition: Profiles.ConditionRolling;
}) {
  return (
    <>
      <Text variant="titleMedium">Recheck After</Text>
      <SliderWithValue
        unit="s"
        value={condition.recheckAfter}
        minimumValue={1}
        maximumValue={30}
        step={0.1}
        onValueChange={(v) => runInAction(() => (condition.recheckAfter = v))}
      />
    </>
  );
});

const ConfigureIdleCondition = observer(function ({
  condition,
}: {
  condition: Profiles.ConditionIdle;
}) {
  return (
    <>
      <Text variant="titleMedium">Period</Text>
      <SliderWithValue
        unit="s"
        value={condition.period}
        minimumValue={1}
        maximumValue={15}
        step={0.5}
        onValueChange={(v) => runInAction(() => (condition.period = v))}
      />
    </>
  );
});

const ConfigureBatteryCondition = observer(function ({
  condition,
}: {
  condition: Profiles.ConditionBattery;
}) {
  return (
    <>
      <Text variant="titleMedium">Recheck After</Text>
      <SliderWithValue
        unit="s"
        value={condition.recheckAfter}
        minimumValue={5}
        maximumValue={60}
        step={1}
        onValueChange={(v) => runInAction(() => (condition.recheckAfter = v))}
      />
    </>
  );
});

const ConfigurePlayAnimation = observer(function ({
  action,
  conditionType,
}: {
  action: Profiles.ActionPlayAnimation;
  conditionType: Profiles.ConditionType;
}) {
  const [animPickerVisible, setAnimPickerVisible] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Partial<AnimationOverrides>>(
    {}
  );
  const { colors } = useTheme();
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
  return (
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
        {action.animation?.name ?? "Select Animation"}
      </GradientButton>
      <PickAnimationModal
        animation={action.animation}
        onSelectAnimation={(anim) => {
          runInAction(() => (action.animation = anim as Profiles.Animation)); // TODO readonly
          setAnimPickerVisible(false);
        }}
        visible={animPickerVisible}
        onDismiss={() => setAnimPickerVisible(false)}
      />
      <EditAnimationOverrides
        overrides={overrides}
        onChangeOverrides={setOverrides}
        style={{ marginLeft: 10 }}
      />
      <GradientButton
        outline
        disabled={!action.animation}
        onPress={showOverridesActionSheet}
        style={{
          marginHorizontal: 10,
          marginTop: Object.keys(overrides).length ? 10 : 0,
        }}
      >
        Add Animation Override
      </GradientButton>
    </>
  );
});

const ConfigurePlayAudioClip = observer(function ({
  action,
}: {
  action: Profiles.ActionPlayAudioClip;
}) {
  return (
    <>
      <Text variant="titleMedium">Play</Text>
      <GradientButton outline onPress={() => {}}>
        Select Sound File
      </GradientButton>
      <Text variant="titleMedium">Volume</Text>
      <SliderWithValue
        unit="%"
        value={action.volume}
        minimumValue={1}
        maximumValue={100}
        step={1}
        onValueChange={(v) => runInAction(() => (action.volume = v))}
      />
    </>
  );
});

const ConfigureSpeakText = observer(function ({
  action,
}: {
  action: Profiles.ActionSpeakText;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
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
        value={action.text}
        onChangeText={(t) => runInAction(() => (action.text = t))}
      />
      <GradientButton outline onPress={() => {}}>
        Copy
      </GradientButton>
      <Text variant="titleMedium">Volume</Text>
      <SliderWithValue
        unit="%"
        value={action.volume}
        minimumValue={1}
        maximumValue={100}
        step={1}
        onValueChange={(v) => runInAction(() => (action.volume = v))}
      />
    </>
  );
});

const ConfigureMakeWebRequest = observer(function ({
  action,
}: {
  action: Profiles.ActionMakeWebRequest;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <>
      <Text variant="titleMedium">URL</Text>
      <BottomSheetTextInput
        // mode="outlined"
        // dense
        value={action.url}
        onChangeText={(t) => runInAction(() => (action.url = t))}
        style={{
          color: colors.onSurfaceVariant,
          backgroundColor: colors.elevation.level0,
          borderWidth: 1,
          borderRadius,
          borderColor: colors.outline,
        }}
      />
      <GradientButton outline onPress={() => {}}>
        Copy
      </GradientButton>
    </>
  );
});

export const ConfigureActionModal = observer(function ({
  condition,
  action,
  dieType,
  unavailableFaces,
  visible,
  onDismiss,
}: {
  condition: Profiles.Condition;
  action: Profiles.Action;
  dieType: PixelDieType;
  unavailableFaces?: number[];
  visible?: boolean;
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

  const theme = useTheme();
  const paddingBottom = useBottomSheetPadding();
  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onDismiss={onDismiss}
      activeOffsetY={Platform.OS === "android" ? [-1, 1] : undefined} // For the slider
      failOffsetX={Platform.OS === "android" ? [-5, 5] : undefined} // For the slider
      keyboardBehavior={Platform.OS === "ios" ? "interactive" : "fillParent"}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={getBottomSheetBackgroundStyle()}
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
            paddingBottom,
            gap: 10,
          }}
        >
          {condition.type === "rolled" ? (
            <ConfigureRolledCondition
              condition={condition as Profiles.ConditionRolled}
              dieType={dieType}
              unavailableFaces={unavailableFaces}
            />
          ) : condition.type === "rolling" ? (
            <ConfigureRollingCondition
              condition={condition as Profiles.ConditionRolling}
            />
          ) : condition.type === "idle" ? (
            <ConfigureIdleCondition
              condition={condition as Profiles.ConditionIdle}
            />
          ) : condition.type === "battery" ? (
            <ConfigureBatteryCondition
              condition={condition as Profiles.ConditionBattery}
            />
          ) : null}
          {action.type === "playAnimation" ? (
            <ConfigurePlayAnimation
              action={action as Profiles.ActionPlayAnimation}
              conditionType={condition.type}
            />
          ) : action.type === "playAudioClip" ? (
            <ConfigurePlayAudioClip
              action={action as Profiles.ActionPlayAudioClip}
            />
          ) : action.type === "speakText" ? (
            <ConfigureSpeakText action={action as Profiles.ActionSpeakText} />
          ) : action.type === "makeWebRequest" ? (
            <ConfigureMakeWebRequest
              action={action as Profiles.ActionMakeWebRequest}
            />
          ) : null}
        </BottomSheetView>
      </ThemeProvider>
    </BottomSheetModal>
  );
});

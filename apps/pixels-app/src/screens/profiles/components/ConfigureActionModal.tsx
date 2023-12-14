import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import * as Clipboard from "expo-clipboard";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Platform, View } from "react-native";
import {
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

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

function TextInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText?: (text: string) => void;
}) {
  const { colors, fonts, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
        gap: 10,
      }}
    >
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        style={{
          flexGrow: 1,
          minHeight: 56, // MD3_MIN_HEIGHT,
          paddingHorizontal: 16, // MD3_INPUT_PADDING_HORIZONTAL,
          color: colors.onSurfaceVariant,
          backgroundColor: colors.elevation.level0,
          borderWidth: 1,
          borderRadius,
          borderColor: colors.outline,
          ...fonts.bodyLarge,
        }}
      />
      <MaterialCommunityIcons
        name="content-copy"
        size={20}
        color={colors.onSurface}
        onPress={() => {
          if (value?.length) {
            Clipboard.setStringAsync(value).catch((e: Error) =>
              console.log(`Clipboard error: ${e}`)
            );
          }
        }}
      />
    </View>
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
        minimumValue={0.5}
        maximumValue={30}
        step={0.1}
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
  const defaultDuration = action.animation?.duration ?? 1;
  const { colors } = useTheme();
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
      <Text variant="titleMedium">Repeat</Text>
      <SliderWithValue
        value={action.loopCount}
        minimumValue={1}
        maximumValue={10}
        step={1}
        onValueChange={(v) => runInAction(() => (action.loopCount = v))}
      />
      <Text variant="titleMedium">Duration Override</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableRipple
          disabled={action.duration === undefined}
          style={{ padding: 10, paddingRight: 20, zIndex: 1 }} // Render on top of scaled slider
          onPress={() => runInAction(() => (action.duration = undefined))}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={
              action.duration === undefined
                ? colors.onSurfaceDisabled
                : colors.onSurface
            }
          />
        </TouchableRipple>
        <View style={{ flexGrow: 1 }}>
          <SliderWithValue
            unit="s"
            fractionDigits={1}
            value={action.duration ?? defaultDuration}
            minimumValue={0.1}
            maximumValue={10}
            step={0.1}
            onValueChange={(v) => runInAction(() => (action.duration = v))}
          />
        </View>
      </View>
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
  return (
    <>
      <Text variant="titleMedium">Text to Read</Text>
      <TextInput
        value={action.text}
        onChangeText={(t) => runInAction(() => (action.text = t))}
      />
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
  return (
    <>
      <Text variant="titleMedium">URL</Text>
      <TextInput
        value={action.url}
        onChangeText={(t) => runInAction(() => (action.url = t))}
      />
      <Text variant="titleMedium">Parameters</Text>
      <TextInput
        value={action.value}
        onChangeText={(t) => runInAction(() => (action.value = t))}
      />
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
          pressBehavior="close"
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

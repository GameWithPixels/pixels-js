import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { assert } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import {
  DiceUtils,
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import * as Clipboard from "expo-clipboard";
import { computed, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Platform, View } from "react-native";
import {
  Button,
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { EditGradientBottomSheet } from "~/components/EditGradientBottomSheet";
import { FacesGrid } from "~/components/FacesGrid";
import { KeyframeGradient } from "~/components/KeyframeGradient";
import { PickAnimationBottomSheet } from "~/components/PickAnimationBottomSheet";
import { PickColorBottomSheet } from "~/components/PickColorBottomSheet";
import {
  SliderWithValue,
  SliderWithValueProps,
} from "~/components/SliderWithTitle";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { buildActionURL } from "~/features/profiles";
import { playRemoteAction } from "~/features/profiles/playRemoteAction";
import { androidBottomSheetSliderFix, TrailingSpaceFix } from "~/fixes";
import { useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

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
        maxLength={100}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          flexGrow: 1,
          paddingVertical: 16, // MD3_MIN_HEIGHT = 56,
          paddingHorizontal: 16, // MD3_INPUT_PADDING_HORIZONTAL
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

const ConfigureRolledCondition = observer(function ConfigureRolledCondition({
  condition,
  dieType,
  unavailableFaces,
}: {
  condition: Profiles.ConditionRolled;
  dieType: PixelDieType;
  unavailableFaces?: number[];
}) {
  const { colors } = useTheme();
  const faces = condition.faces;
  return (
    <>
      <Text variant="titleMedium">When roll is</Text>
      <View>
        <FacesGrid
          dieType={dieType}
          selected={faces}
          unavailable={unavailableFaces}
          onToggleFace={(face) =>
            runInAction(() => {
              const i = faces.indexOf(face);
              if (i >= 0) {
                faces.splice(i, 1);
              } else {
                faces.push(face);
              }
            })
          }
          style={{ marginHorizontal: 10 }}
        />
        {DiceUtils.getFaceCount(dieType) > 6 && (
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 10,
              justifyContent: "space-between",
            }}
          >
            <Button
              compact
              textColor={colors.primary}
              sentry-label="select-all-faces"
              onPress={() =>
                runInAction(
                  () =>
                    (condition.faces = DiceUtils.getDieFaces(dieType).filter(
                      (f) => !unavailableFaces?.includes(f)
                    ))
                )
              }
            >
              {"Select All" + TrailingSpaceFix}
            </Button>
            <Button
              compact
              textColor={colors.primary}
              sentry-label="unselect-all-faces"
              onPress={() => runInAction(() => (faces.length = 0))}
            >
              Unselect All
            </Button>
          </View>
        )}
      </View>
    </>
  );
});

const ConfigureRollingCondition = observer(function ConfigureRollingCondition({
  condition,
}: {
  condition: Profiles.ConditionRolling;
}) {
  return (
    <>
      <Text variant="titleMedium">Recheck After</Text>
      <SliderWithValue
        unit="s"
        fractionDigits={1}
        value={condition.recheckAfter}
        minimumValue={1}
        maximumValue={30}
        step={0.1}
        sentry-label="change-rolling-recheck-after"
        onValueChange={(v) => runInAction(() => (condition.recheckAfter = v))}
      />
    </>
  );
});

const ConfigureIdleCondition = observer(function ConfigureIdleCondition({
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
        sentry-label="change-idle-period"
        onValueChange={(v) => runInAction(() => (condition.period = v))}
      />
    </>
  );
});

const ConfigureBatteryCondition = observer(function ConfigureBatteryCondition({
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
        sentry-label="change-battery-recheck-after"
        onValueChange={(v) => runInAction(() => (condition.recheckAfter = v))}
      />
    </>
  );
});

const ConfigurePlayAnimation = observer(function ConfigurePlayAnimation({
  action,
  dieType,
}: {
  action: Profiles.ActionPlayAnimation;
  dieType?: PixelDieType;
}) {
  const [animPickerVisible, setAnimPickerVisible] = React.useState(false);
  // TODO Several animation types may have those keys
  const color = (action.animation as Partial<Profiles.AnimationFlashes>)?.color;
  const keyframes = (action.animation as Partial<Profiles.AnimationGradient>)
    ?.gradient?.keyframes;
  const repeatCount = (action.animation as Partial<Profiles.AnimationFlashes>)
    ?.count;
  const fading = (action.animation as Partial<Profiles.AnimationFlashes>)?.fade;
  const intensity = (action.animation as Partial<Profiles.AnimationRainbow>)
    ?.intensity;
  return (
    <>
      <View>
        <Text variant="titleMedium">Play</Text>
        <GradientButton
          outline
          sentry-label="select-animation"
          style={{ marginHorizontal: 10 }}
          onPress={() => setAnimPickerVisible(true)}
        >
          {action.animation?.name ?? "Select Animation"}
        </GradientButton>
      </View>
      <PickAnimationBottomSheet
        animation={action.animation}
        dieType={dieType}
        visible={animPickerVisible}
        onSelectAnimation={(anim) => {
          runInAction(() => {
            action.animation = anim as Profiles.Animation; // TODO This cast removes readonly
            // Clear overrides
            action.duration = undefined;
            action.fade = undefined;
            action.intensity = undefined;
            action.colors.length = 0;
          });
          setAnimPickerVisible(false);
        }}
        onDismiss={() => setAnimPickerVisible(false)}
      />
      <PlayAnimationSlider
        title="Duration"
        unit="s"
        fractionDigits={1}
        minimumValue={0.1}
        maximumValue={10}
        step={0.1}
        value={action.duration ?? action.animation?.duration ?? 1}
        isDefault={action.duration === undefined}
        onValueChange={(v) => (action.duration = v)}
        onReset={() => (action.duration = undefined)}
      />
      {color && color.mode === "rgb" && (
        <PlayAnimationColor action={action} defaultColor={color.color} />
      )}
      {keyframes && keyframes.length > 1 && (
        <PlayAnimationGradient action={action} defaultKeyframes={keyframes} />
      )}
      {repeatCount !== undefined && (
        <PlayAnimationSlider
          title="Repeat Count"
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={action.loopCount > 0 ? action.loopCount : repeatCount}
          isDefault={!action.loopCount}
          onValueChange={(v) => (action.loopCount = v)}
          onReset={() => (action.loopCount = 0)}
        />
      )}
      {fading !== undefined && (
        <PlayAnimationSlider
          title="Fading"
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          fractionDigits={2}
          value={action.fade ?? fading}
          isDefault={action.fade === undefined}
          onValueChange={(v) => (action.fade = v)}
          onReset={() => (action.fade = undefined)}
        />
      )}
      {intensity !== undefined && (
        <PlayAnimationSlider
          title="Intensity"
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          fractionDigits={2}
          value={action.intensity ?? intensity}
          isDefault={action.intensity === undefined}
          onValueChange={(v) => (action.intensity = v)}
          onReset={() => (action.intensity = undefined)}
        />
      )}
    </>
  );
});

const PlayAnimationSlider = observer(function Slider({
  title,
  value,
  isDefault,
  onValueChange,
  onReset,
  ...props
}: {
  title: string;
  value: number;
  isDefault: boolean;
  onValueChange: (value: number) => void;
  onReset: () => void;
} & Omit<SliderWithValueProps, "value" | "onValueChange">) {
  const sentryLabel = title.toLowerCase().replace(" ", "-");
  const { colors } = useTheme();
  return (
    <View>
      <Text variant="titleMedium">{title}</Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: -5 }}
      >
        <TouchableRipple
          disabled={isDefault}
          sentry-label={"reset-animation-" + sentryLabel}
          style={{ padding: 10, paddingRight: 20, zIndex: 10 }} // Render on top of scaled slider
          onPress={() => runInAction(onReset)}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={isDefault ? colors.onSurfaceDisabled : colors.onSurface}
          />
        </TouchableRipple>
        <View style={{ flexGrow: 1 }}>
          <SliderWithValue
            value={value}
            sentry-label={"edit-animation-" + sentryLabel}
            onValueChange={(v) => runInAction(() => onValueChange(v))}
            {...props}
          />
        </View>
      </View>
    </View>
  );
});

const PlayAnimationColor = observer(function PlayAnimationColor({
  action,
  defaultColor,
}: {
  action: Profiles.ActionPlayAnimation;
  defaultColor?: Profiles.Color;
}) {
  const selectedColor = action.colors[0] ?? defaultColor;
  const [colorPickerVisible, setColorPickerVisible] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <View>
      <Text variant="titleMedium">Color</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableRipple
          disabled={!action.colors}
          sentry-label="reset-color"
          style={{ padding: 10, paddingRight: 20, zIndex: 1 }} // Render on top of scaled slider
          onPress={() => runInAction(() => (action.colors.length = 0))}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={!action.colors ? colors.onSurfaceDisabled : colors.onSurface}
          />
        </TouchableRipple>
        <TouchableRipple
          sentry-label="edit-color"
          style={{ flexGrow: 1, height: 32 }}
          onPress={() => setColorPickerVisible(true)}
        >
          <View
            style={{
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderRadius,
              borderColor: colors.outline,
              backgroundColor: selectedColor.toString(),
            }}
          >
            <Text
              style={{
                position: "absolute",
                top: -20,
                color: colors.onSurfaceDisabled,
                alignSelf: "center",
              }}
            >
              Tap to modify
            </Text>
          </View>
        </TouchableRipple>
      </View>

      <PickColorBottomSheet
        color={selectedColor}
        visible={colorPickerVisible}
        onSelectColor={(color) => {
          runInAction(() => {
            action.colors.length = 1;
            action.colors[0] = new Profiles.Color(color);
          });
          setColorPickerVisible(false);
        }}
        onDismiss={() => setColorPickerVisible(false)}
      />
    </View>
  );
});

const PlayAnimationGradient = observer(function PlayAnimationGradient({
  action,
  defaultKeyframes,
}: {
  action: Profiles.ActionPlayAnimation;
  defaultKeyframes: Profiles.RgbKeyframe[];
}) {
  assert(defaultKeyframes.length > 1, "Must have at least 2 keyframes");
  const [gradientEditorVisible, setGradientEditorVisible] =
    React.useState(false);

  // At least 2 keyframes
  const keyframes = React.useMemo(
    () =>
      computed(() =>
        action.colors.length > 1
          ? defaultKeyframes.map(
              (kf, i) =>
                new Profiles.RgbKeyframe({
                  time: kf.time,
                  color: action.colors[i] ?? kf.color,
                })
            )
          : defaultKeyframes
      ),
    [action.colors, defaultKeyframes]
  ).get();

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <View>
      <Text variant="titleMedium">Gradient</Text>
      <Text
        style={{
          position: "absolute",
          color: colors.onSurfaceDisabled,
          alignSelf: "center",
          paddingLeft: 50,
          marginTop: 10,
        }}
      >
        Tap to modify
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableRipple
          disabled={!action.colors.length}
          sentry-label="reset-gradient"
          style={{ padding: 10, paddingRight: 20, zIndex: 1 }} // Render on top of scaled slider
          onPress={() => runInAction(() => (action.colors.length = 0))}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={
              !action.colors.length
                ? colors.onSurfaceDisabled
                : colors.onSurface
            }
          />
        </TouchableRipple>
        <TouchableRipple
          sentry-label="edit-gradient"
          style={{
            overflow: "hidden",
            flex: 1,
            flexGrow: 1,
            height: 32,
            borderColor: colors.outline,
            borderWidth: 1,
            borderRadius,
          }}
          onPress={() => setGradientEditorVisible(true)}
        >
          <KeyframeGradient keyframes={keyframes} />
        </TouchableRipple>
      </View>

      <EditGradientBottomSheet
        keyframes={keyframes}
        visible={gradientEditorVisible}
        onChangeKeyframes={(keyframes) => {
          if (keyframes.length > 1) {
            runInAction(() => {
              const count = keyframes.length;
              action.colors.length = count;
              for (let i = 0; i < count; ++i) {
                action.colors[i] = keyframes[i].color.duplicate();
              }
            });
          }
        }}
        onDismiss={() => setGradientEditorVisible(false)}
      />
    </View>
  );
});

const ConfigurePlayAudioClip = observer(function ConfigurePlayAudioClip({
  action,
}: {
  action: Profiles.ActionPlayAudioClip;
}) {
  return (
    <>
      <Text variant="titleMedium">Play</Text>
      <GradientButton
        outline
        sentry-label="select-sound-file"
        onPress={() => {}}
      >
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

const ConfigureSpeakText = observer(function ConfigureSpeakText({
  action,
}: {
  action: Profiles.ActionSpeakText;
}) {
  const { colors } = useTheme();
  return (
    <>
      <Text variant="titleMedium">Text to Speak</Text>
      <TextInput
        value={action.text}
        onChangeText={(t) => runInAction(() => (action.text = t))}
      />
      <Text variant="titleMedium">Voice Pitch</Text>
      <SliderWithValue
        value={action.pitch}
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        fractionDigits={2}
        sentry-label="change-volume"
        onValueChange={(v) => runInAction(() => (action.pitch = v))}
      />
      <Text variant="titleMedium">Voice Rate</Text>
      <SliderWithValue
        value={action.rate}
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        fractionDigits={2}
        sentry-label="change-volume"
        onValueChange={(v) => runInAction(() => (action.rate = v))}
      />
      <OutlineButton onPress={() => playRemoteAction(action)}>
        Test Speech
      </OutlineButton>
      {Platform.OS === "android" && (
        <Text style={{ color: colors.onSurfaceDisabled }}>
          This feature only works if you have Google Play on your device.
        </Text>
      )}
    </>
  );
});

const ConfigureMakeWebRequest = observer(function ConfigureMakeWebRequest({
  action,
  profileName,
}: {
  action: Profiles.ActionMakeWebRequest;
  profileName: string;
}) {
  const urlOpt = { profileName, pixelName: "pixel" } as const;
  const { colors } = useTheme();
  return (
    <>
      <Text variant="titleMedium">Send request to URL</Text>
      <TextInput
        value={action.url}
        onChangeText={(t) => runInAction(() => (action.url = t))}
      />
      <Text variant="titleMedium">Value</Text>
      <TextInput
        value={action.value}
        onChangeText={(t) => runInAction(() => (action.value = t))}
      />
      <Text style={{ color: colors.onSurfaceDisabled, marginTop: 10 }}>
        The request will look like this:
      </Text>
      <Text style={{ color: colors.onSurfaceDisabled }}>
        {buildActionURL(action, urlOpt)}
      </Text>
      <Text style={{ color: colors.onSurfaceDisabled }}>
        Where "{urlOpt.pixelName}" is replaced by the name of the die that
        triggered this action.
      </Text>
      <OutlineButton onPress={() => playRemoteAction(action, urlOpt)}>
        Test Web Request
      </OutlineButton>
    </>
  );
});

export const ConfigureActionBottomSheet = observer(
  function ConfigureActionBottomSheet({
    condition,
    action,
    dieType,
    profileName,
    unavailableFaces,
    visible,
    onDismiss,
  }: {
    condition: Profiles.Condition;
    action: Profiles.Action;
    dieType: PixelDieType;
    profileName: string;
    unavailableFaces?: number[];
    visible?: boolean;
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
    const paddingBottom = useBottomSheetPadding(15);
    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        onDismiss={onDismiss}
        onChange={onChange}
        keyboardBehavior="interactive"
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
        {...androidBottomSheetSliderFix}
      >
        <RootSiblingParent>
          <ThemeProvider theme={theme}>
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom,
                gap: 5,
              }}
            >
              <Text variant="titleMedium" style={AppStyles.selfCentered}>
                Configure Rule Action
              </Text>
              <Text
                style={{
                  alignSelf: "center",
                  color: colors.onSurfaceDisabled,
                }}
              >
                Slide down to close
              </Text>
              {condition instanceof Profiles.ConditionRolled && (
                <ConfigureRolledCondition
                  condition={condition}
                  dieType={dieType}
                  unavailableFaces={unavailableFaces}
                />
              )}
              {action instanceof Profiles.ActionPlayAnimation ? (
                <ConfigurePlayAnimation action={action} dieType={dieType} />
              ) : action instanceof Profiles.ActionPlayAudioClip ? (
                <ConfigurePlayAudioClip action={action} />
              ) : action instanceof Profiles.ActionSpeakText ? (
                <ConfigureSpeakText action={action} />
              ) : action instanceof Profiles.ActionMakeWebRequest ? (
                <ConfigureMakeWebRequest
                  action={action}
                  profileName={profileName}
                />
              ) : null}
              {condition instanceof Profiles.ConditionRolling ? (
                <ConfigureRollingCondition condition={condition} />
              ) : condition instanceof Profiles.ConditionIdle ? (
                <ConfigureIdleCondition condition={condition} />
              ) : condition instanceof Profiles.ConditionBattery ? (
                <ConfigureBatteryCondition condition={condition} />
              ) : null}
            </BottomSheetScrollView>
          </ThemeProvider>
        </RootSiblingParent>
      </BottomSheetModal>
    );
  }
);

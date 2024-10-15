import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import {
  Color,
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
  IconButton,
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppSelector } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { ActionPlayAnimDieRenderer } from "~/components/ActionPlayAnimDieRenderer";
import { EditGradientBottomSheet } from "~/components/EditGradientBottomSheet";
import { FacesGrid } from "~/components/FacesGrid";
import { KeyframeGradient } from "~/components/KeyframeGradient";
import { PickAnimationBottomSheet } from "~/components/PickAnimationBottomSheet";
import { PickAudioClipBottomSheet } from "~/components/PickAudioClipBottomSheet";
import { PickColorBottomSheet } from "~/components/PickColorBottomSheet";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import {
  SliderWithValue,
  SliderWithValueProps,
} from "~/components/SliderWithValue";
import { TabsHeaders } from "~/components/TabsHeaders";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  getColorOverrideLabel,
  getDieTypeLabel,
  getSimplifyDiscordWebhookPayload,
  getWebRequestPayload,
  getWebRequestURL,
  playActionAudioClip,
  playActionMakeWebRequest,
  playActionSpeakText,
} from "~/features/profiles";
import { AnimationUtils } from "~/features/store/library";
import { TrailingSpaceFix } from "~/fixes";
import { useBottomSheetBackHandler, useBottomSheetPadding } from "~/hooks";

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
        maxLength={500}
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
  const faces = condition.faces.map((f) =>
    DiceUtils.unMapFaceFromAnimation(f, dieType)
  );
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
              face = DiceUtils.mapFaceForAnimation(face, dieType);
              const i = condition.faces.indexOf(face);
              if (i >= 0) {
                condition.faces.splice(i, 1);
              } else {
                condition.faces.push(face);
              }
            })
          }
          style={{ marginHorizontal: 10 }}
        />
        {DiceUtils.getFaceCount(dieType) >= 6 && (
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
                    (condition.faces = DiceUtils.getDieFaces(dieType)
                      .filter((f) => !unavailableFaces?.includes(f))
                      .map((f) => DiceUtils.mapFaceForAnimation(f, dieType)))
                )
              }
            >
              {"Select All" + TrailingSpaceFix}
            </Button>
            <Button
              compact
              textColor={colors.primary}
              sentry-label="unselect-all-faces"
              onPress={() => runInAction(() => (condition.faces.length = 0))}
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
        minimumValue={0.1}
        maximumValue={60}
        step={0.1}
        value={condition.recheckAfter}
        onEndEditing={(v) => runInAction(() => (condition.recheckAfter = v))}
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
        minimumValue={0.5}
        maximumValue={30}
        step={0.1}
        value={condition.period}
        onEndEditing={(v) => runInAction(() => (condition.period = v))}
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
        minimumValue={5}
        maximumValue={60}
        step={1}
        value={condition.recheckAfter}
        onEndEditing={(v) => runInAction(() => (condition.recheckAfter = v))}
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
  const color = AnimationUtils.getColor(action.animation);
  const fading = AnimationUtils.getFading(action.animation);
  const intensity = AnimationUtils.getIntensity(action.animation);
  const keyframes = AnimationUtils.getGradientKeyframes(action.animation);
  const gradientColorType = AnimationUtils.getGradientColorType(
    action.animation
  );
  return (
    <>
      <View>
        <Text variant="titleMedium">Play</Text>
        <GradientButton
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
            action.loopCount = 1;
            action.fade = undefined;
            action.intensity = undefined;
            action.colors.length = 0;
          });
          setAnimPickerVisible(false);
        }}
        onDismiss={() => setAnimPickerVisible(false)}
      />
      <PlayAnimationSlider
        unit="s"
        fractionDigits={1}
        minimumValue={0.1}
        maximumValue={10}
        step={0.1}
        value={action.duration ?? action.animation?.duration ?? 1}
        isDefault={action.duration === undefined}
        onValueChange={(v) => (action.duration = v)}
        onReset={() => (action.duration = undefined)}
      >
        Duration
      </PlayAnimationSlider>
      {color?.mode === "rgb" ? (
        <PlayAnimationColor action={action} defaultColor={color.color} />
      ) : (
        (gradientColorType || color?.mode === "face") && (
          <>
            <Text variant="titleMedium">Color</Text>
            <Text style={{ paddingLeft: 10, ...AppStyles.greyedOut }}>
              {getColorOverrideLabel(gradientColorType ?? "faceToRainbowWheel")}
              .
            </Text>
          </>
        )
      )}
      {keyframes && keyframes.length > 1 && (
        <PlayAnimationGradient action={action} defaultKeyframes={keyframes} />
      )}
      <PlayAnimationSlider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={action.loopCount}
        isDefault={action.loopCount <= 1}
        onValueChange={(v) => (action.loopCount = v)}
        onReset={() => (action.loopCount = 1)}
      >
        Repeat Count
      </PlayAnimationSlider>
      {fading !== undefined && (
        <PlayAnimationSlider
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          percentage
          value={action.fade ?? fading}
          isDefault={action.fade === undefined}
          onValueChange={(v) => (action.fade = v)}
          onReset={() => (action.fade = undefined)}
        >
          Fading
        </PlayAnimationSlider>
      )}
      {intensity !== undefined && (
        <PlayAnimationSlider
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          percentage
          value={action.intensity ?? intensity}
          isDefault={action.intensity === undefined}
          onValueChange={(v) => (action.intensity = v)}
          onReset={() => (action.intensity = undefined)}
        >
          Intensity
        </PlayAnimationSlider>
      )}
    </>
  );
});

const PlayAnimationSlider = observer(function Slider({
  children,
  value,
  isDefault,
  onReset,
  onValueChange,
  ...props
}: {
  value: number;
  isDefault: boolean;
  onReset: () => void;
} & Omit<SliderWithValueProps, "onEndEditing">) {
  const { colors } = useTheme();
  return (
    <View>
      <Text variant="titleMedium">{children}</Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: -5 }}
      >
        <TouchableRipple
          disabled={isDefault}
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
            onEndEditing={(v) => runInAction(() => onValueChange?.(v))}
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
  defaultColor?: Color;
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
          disabled={!action.colors.length}
          sentry-label="reset-color"
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
            action.colors[0] = new Color(color);
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
  defaultKeyframes: readonly Readonly<Profiles.RgbKeyframe>[];
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
  const [clipPickerVisible, setClipPickerVisible] = React.useState(false);
  const clipName = useAppSelector(
    (state) =>
      action.clipUuid &&
      state.libraryAssets.audioClips.entities[action.clipUuid]?.name
  );
  return (
    <>
      <Text variant="titleMedium">Play</Text>
      <GradientButton
        outline
        sentry-label="select-audio-clip"
        onPress={() => setClipPickerVisible(true)}
      >
        {clipName ?? "Select Audio Clip"}
      </GradientButton>
      <PlayAnimationSlider
        minimumValue={0}
        maximumValue={1}
        step={0.01}
        percentage
        value={action.volume}
        isDefault={action.volume === 1}
        onValueChange={(v) => (action.volume = v)}
        onReset={() => (action.volume = 1)}
      >
        Volume
      </PlayAnimationSlider>
      <PlayAnimationSlider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={action.loopCount}
        isDefault={action.loopCount <= 1}
        onValueChange={(v) => (action.loopCount = v)}
        onReset={() => (action.loopCount = 1)}
      >
        Repeat Count
      </PlayAnimationSlider>
      <PickAudioClipBottomSheet
        audioClipUuid={action.clipUuid}
        visible={clipPickerVisible}
        onSelectAudioClip={(clipUuid) => {
          runInAction(() => (action.clipUuid = clipUuid));
          setClipPickerVisible(false);
        }}
        onDismiss={() => setClipPickerVisible(false)}
      />
      <OutlineButton onPress={() => playActionAudioClip(action, clipName)}>
        Test Audio
      </OutlineButton>
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
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        percentage
        value={action.pitch}
        onEndEditing={(v) => runInAction(() => (action.pitch = v))}
      />
      <Text variant="titleMedium">Voice Rate</Text>
      <SliderWithValue
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        percentage
        value={action.rate}
        onEndEditing={(v) => runInAction(() => (action.rate = v))}
      />
      <Text style={{ color: colors.onSurfaceDisabled, marginVertical: 5 }}>
        {Platform.OS === "android"
          ? "Only works if you have Google Play on your device."
          : "Please make sure that your device is not in silent mode."}
      </Text>
      <OutlineButton onPress={() => playActionSpeakText(action)}>
        Test Speech
      </OutlineButton>
    </>
  );
});

const NamedFormatsValues = ["Parameters", "JSON", "Discord"] as const;
type NamedFormat = (typeof NamedFormatsValues)[number];

function toNamedFormat(format: Profiles.ActionWebRequestFormat): NamedFormat {
  switch (format) {
    case "parameters":
      return "Parameters";
    case "json":
      return "JSON";
    case "discord":
      return "Discord";
    default:
      assertNever(format, `Unsupported WebRequest format: ${format}`);
  }
}

function fromNamedFormat(format: NamedFormat): Profiles.ActionWebRequestFormat {
  switch (format) {
    case "Parameters":
      return "parameters";
    case "JSON":
      return "json";
    case "Discord":
      return "discord";
    default:
      assertNever(format, `Unsupported WebRequest named format: ${format}`);
  }
}

function getHighestFace(
  faces: readonly number[] | false,
  dieType: PixelDieType
): number {
  const highFace = DiceUtils.getHighestFace(dieType);
  if (!faces || faces.includes(highFace)) {
    return highFace;
  } else {
    return Math.max(...faces);
  }
}

const ConfigureMakeWebRequest = observer(function ConfigureMakeWebRequest({
  action,
  profileName,
  dieType,
  currentFace,
}: {
  action: Profiles.ActionMakeWebRequest;
  profileName: string;
  dieType: PixelDieType;
  currentFace: number;
}) {
  const pixel = { name: "Pixels " + getDieTypeLabel(dieType), currentFace };
  const payload = getWebRequestPayload(pixel, profileName, action.value);
  const isParams = !action.format || action.format === "parameters"; // Format is undefined in actions from v2.1
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
      <Text variant="titleMedium">Format</Text>
      <TabsHeaders
        keys={NamedFormatsValues}
        selected={toNamedFormat(action.format ?? "parameters")} // Format is undefined in actions from v2.1
        onSelect={(f) =>
          runInAction(() => (action.format = fromNamedFormat(f as NamedFormat)))
        }
      />
      <Text style={{ color: colors.onSurfaceDisabled, marginTop: 5 }}>
        The request {isParams ? "parameters" : "payload"} will look like this:
        {isParams
          ? "\n" + getWebRequestURL("", payload)
          : " " +
            JSON.stringify(
              action.format === "json"
                ? payload
                : getSimplifyDiscordWebhookPayload(dieType, payload),
              null,
              4
            )}
      </Text>
      {isParams && (
        <Text style={{ color: colors.onSurfaceDisabled }}>
          With:
          {"\n"}• value1: name of the die that triggered this action
          {"\n"}• value2: value of the action (currently "{action.value}")
          {"\n"}• value3: value of the die's face up
          {"\n"}• value4: name of the profile
        </Text>
      )}
      <OutlineButton
        onPress={() => playActionMakeWebRequest(action, dieType, payload)}
        style={{ marginTop: 5 }}
      >
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
        {...getBottomSheetProps(colors)}
        // {...androidBottomSheetSliderFix}
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
              {action instanceof Profiles.ActionPlayAnimation && (
                <View
                  style={{ width: 200, aspectRatio: 1, alignSelf: "center" }}
                >
                  <ActionPlayAnimDieRenderer
                    action={action}
                    dieType={dieType}
                  />
                </View>
              )}
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
                  dieType={dieType}
                  currentFace={getHighestFace(
                    condition instanceof Profiles.ConditionRolled &&
                      condition.faces.map((f) =>
                        DiceUtils.unMapFaceFromAnimation(f, dieType)
                      ),
                    dieType
                  )}
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
            <IconButton
              icon="close"
              iconColor={colors.primary}
              sentry-label="close-configure-action"
              style={{ position: "absolute", right: 0, top: -15 }}
              onPress={onDismiss}
            />
            <SelectedPixelTransferProgressBar style={{ top: 30 }} />
          </ThemeProvider>
        </RootSiblingParent>
      </BottomSheetModal>
    );
  }
);

import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { createDataSetForAnimations } from "@systemic-games/pixels-edit-animation";
import {
  DiceUtils,
  getPixel,
  Pixel,
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Divider,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import Animated, {
  CurvedTransition,
  Easing,
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { DiceRollerScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import {
  HeaderMenuButton,
  HeaderMenuButtonProps,
} from "~/components/HeaderMenuButton";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { Banner } from "~/components/banners";
import { DieWireframe } from "~/components/icons";
import { AvailableDieTypes } from "~/features/dice/AvailableDieTypes";
import { tokenize } from "~/features/dice-notation";
import {
  computeRollsResult,
  getExpectedRolls,
  getRollsResults,
} from "~/features/rollFormula";
import {
  addCompositeRollerEntry,
  addSingleRollerEntry,
  hideAllRollerEntries,
  hideRollerEntry,
  RollerCompositeEntry,
  RollerSingleEntry,
  setActiveRollerProfileUuid,
  setRollerCardsSizeRatio,
  setRollerPaused,
} from "~/features/store";
import { iOSBorderRadiusFix } from "~/fixes";
import { useOptionalCompositeProfile, usePixelsCentral } from "~/hooks";

async function playInstantAnimationsAsync(
  pixel: Pixel,
  animation: Profiles.Animation
): Promise<void> {
  const dataSet = createDataSetForAnimations([animation]).toDataSet();
  await pixel.transferInstantAnimations(dataSet);
  await pixel.playInstantAnimation(0);
}

interface AnimatedRollCardHandle {
  overrideWidth: (w: number) => void;
}

const AnimatedRollCard = React.forwardRef(function AnimatedRollCard(
  {
    children,
    width: widthProp,
    position,
    onRemove,
  }: {
    children: (props: { width: number }) => React.ReactNode;
    width: number;
    position?: "left" | "right";
    onRemove?: () => void;
  },
  ref: React.ForwardedRef<AnimatedRollCardHandle>
) {
  const [width, setWidth] = React.useState(widthProp);
  React.useImperativeHandle(ref, () => {
    return {
      overrideWidth: (w: number) => {
        setWidth(w);
      },
    };
  }, []);
  React.useEffect(() => setWidth(widthProp), [widthProp]);

  const { width: screenWidth } = useWindowDimensions();
  const rightSide = position === "right";
  const startPosition =
    screenWidth / 2 -
    (rightSide
      ? Math.max(-screenWidth / 2 + width, width * 0.1)
      : Math.min(screenWidth / 2, width * 0.9));

  const pressed = useSharedValue(false);
  const offset = useSharedValue(0);
  const initialTouchLocation = useSharedValue<{ x: number; y: number } | null>(
    null
  );
  const panActive = useSharedValue(false);
  panActive.value = !!onRemove;

  // https://github.com/software-mansion/react-native-gesture-handler/issues/1933#issuecomment-1566953466
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onBegin((ev) => {
      initialTouchLocation.value = { x: ev.x, y: ev.y };
    })
    .onTouchesMove((ev, state) => {
      // Sanity checks
      if (!initialTouchLocation.value || !ev.changedTouches.length) {
        state.fail();
      } else {
        const touch = ev.changedTouches[0];
        const xDiff = Math.abs(touch.x - initialTouchLocation.value.x);
        const yDiff = Math.abs(touch.y - initialTouchLocation.value.y);
        // Check if the gesture is horizontal or if it's already activated
        // as we don't want to interrupt an ongoing swipe
        if (pressed.value || xDiff > yDiff) {
          // Horizontal panning
          state.activate();
        } else {
          state.fail();
        }
      }
    })
    .onStart(() => (pressed.value = true))
    .onChange((ev) => panActive.value && (offset.value = ev.translationX))
    .onEnd(() => {
      pressed.value = false;
      if (panActive.value) {
        const pos = startPosition + offset.value;
        if (
          offset.value < 0
            ? pos + width > 0.2 * screenWidth
            : pos < 0.8 * screenWidth
        ) {
          offset.value = withSpring(0);
        } else {
          const dest = Math.sign(offset.value) * screenWidth;
          offset.value = withTiming(dest, { duration: 200 });
          if (onRemove) {
            runOnJS(onRemove)();
          }
        }
      }
    });
  React.useEffect(() => {
    return () => {
      if (panActive.value) {
        const startPositionLeft =
          screenWidth / 2 - Math.min(screenWidth / 2, width * 0.9);
        const startPositionRight =
          screenWidth / 2 - Math.max(-screenWidth / 2 + width, width * 0.1);
        if (position === "right") {
          offset.value = startPositionRight - startPositionLeft;
          offset.value = withTiming(0, { duration: 300 });
        } else {
          offset.value = startPositionLeft - startPositionRight;
          offset.value = withTiming(0, { duration: 300 });
        }
      }
    };
  }, [offset, panActive, position, screenWidth, width]);
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const { colors } = useTheme();
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInDown.springify().mass(1).damping(20).stiffness(200)}
        layout={CurvedTransition.easingY(Easing.linear).duration(300)}
        style={[{ width: "100%" }, animatedStyles]}
      >
        <Card
          row
          frameless
          noBorder
          vivid
          contentStyle={[
            {
              margin: width * 0.03,
              gap: width * 0.04,
              backgroundColor: colors.background,
            },
          ]}
          style={{
            alignSelf: "flex-start",
            left: startPosition,
            marginVertical: width * 0.05,
            width,
          }}
        >
          <Pressable
            onLongPress={() => onRemove?.()}
            style={{
              flexDirection: "row",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: width * 0.01,
            }}
            children={children({ width })}
          />
        </Card>
      </Animated.View>
    </GestureDetector>
  );
});

function SingleRoll({
  dieType,
  faceValue,
  width,
}: {
  dieType: PixelDieType;
  faceValue: number;
  width: number;
}) {
  const { colors } = useTheme();
  return (
    <>
      <DieWireframe dieType={dieType} size={width * 0.3} />
      <Divider
        style={{
          height: "95%",
          width: 1,
          backgroundColor: colors.onPrimary,
          marginLeft: width * 0.03,
        }}
      />
      <Text
        style={{
          fontFamily: "LTInternet-Bold",
          flexGrow: 1,
          textAlign: "center",
          fontSize: width * 0.45,
          lineHeight: width * 0.5,
        }}
      >
        {faceValue}
      </Text>
    </>
  );
}

function CompositeRoll({
  formula,
  result,
  rolls,
  width,
}: {
  formula: string;
  result?: number;
  rolls: { dieType: PixelDieType; value?: number }[];
  width: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ width: "100%" }}>
      <Text
        // adjustsFontSizeToFit // Not working
        numberOfLines={1}
        style={{
          width: "100%",
          fontFamily: "LTInternet-Bold",
          textAlign: "center",
          fontSize: width * 0.2,
          lineHeight: width * 0.22,
        }}
      >
        {formula}
      </Text>
      <View style={{ flexDirection: "row", width: "100%" }}>
        <View
          style={{
            width: width * 0.3,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {rolls.map(({ dieType, value }, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
              }}
            >
              <DieWireframe dieType={dieType} size={width * 0.15} />
              <Text
                style={{
                  fontFamily: "LTInternet-Bold",
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: width * 0.14,
                  lineHeight: width * 0.15,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
        <Divider
          style={{
            height: "95%",
            width: 1,
            backgroundColor: colors.onPrimary,
            marginLeft: width * 0.03,
          }}
        />
        <Text
          style={{
            fontFamily: "LTInternet-Bold",
            flexGrow: 1,
            textAlign: "center",
            fontSize: width * 0.45,
            lineHeight: width * 0.5,
          }}
        >
          {result}
        </Text>
      </View>
    </View>
  );
}

function CompositeRoll2({
  formula,
  result,
  rolls,
}: {
  formula: string;
  result?: number;
  rolls: { dieType: PixelDieType; value?: number }[];
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        marginVertical: 10,
        gap: 10,
      }}
    >
      <Text variant="headlineLarge">
        {formula}
        {result !== undefined ? ` = ${result}` : ""}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {rolls.map(({ dieType, value }, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              paddingVertical: 5,
              paddingHorizontal: 10,
              gap: 10,
              alignItems: "center",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.onSurface,
              borderRadius: 10,
            }}
          >
            <DieWireframe dieType={dieType} size={40} />
            <Text
              style={{
                fontFamily: "LTInternet-Bold",
                textAlign: "center",
                fontSize: 30,
                lineHeight: 33,
              }}
            >
              {value ?? "?"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FormulaCard({
  formula,
  speak,
  animation,
  rolls: appRolls,
  onDismiss,
  onReset,
}: {
  formula: string;
  speak?: boolean;
  animation?: Profiles.Animation;
  rolls: readonly RollerSingleEntry[];
  onDismiss: (
    entry: Omit<RollerCompositeEntry, "timestamp"> | undefined
  ) => void;
  onReset: () => void;
}) {
  const [isDone, setIsDone] = React.useState(false);
  const dismissTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => {
    return () => {
      // Clear timeout on dismount
      clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  // Start time
  const startTimestampRef = React.useRef(Date.now());

  // Keep rolls that are newer than the formula
  const rolls = React.useMemo(
    () => appRolls.filter((r) => r.timestamp >= startTimestampRef.current),
    [appRolls]
  );

  const tagsRef = React.useRef<{ tag: string; value: number }[]>([]);
  const configOverrides = React.useMemo(
    () => ({
      context: {
        addTag: (tag: string, value: number) => {
          console.log(`Adding tag ${tag} with value ${value}`);
          tagsRef.current.push({ tag, value });
        },
      },
    }),
    []
  );

  // Get the expected rolls based on the formula
  const { tokens, tokenizerError } = React.useMemo(() => {
    try {
      const tokens = tokenize(formula, configOverrides);
      return {
        tokens,
        tokenizerError: tokens.length ? undefined : "Blank or empty formula",
      };
    } catch (e) {
      return {
        tokens: [],
        tokenizerError: String(e),
      };
    }
  }, [configOverrides, formula]);
  const expectedRolls = React.useMemo(
    () => getExpectedRolls(tokens, configOverrides),
    [configOverrides, tokens]
  );

  // And merge with the actual rolls
  const { results: rollsResults, selectedIndices } = React.useMemo(
    () => getRollsResults(expectedRolls, rolls),
    [expectedRolls, rolls]
  );
  const compositeRolls = React.useMemo(() => {
    const ret = [];
    for (let i = 0; i < expectedRolls.length; ++i) {
      const rolls = expectedRolls[i];
      const results = rollsResults[i];
      if (rolls?.length && rolls?.length === results?.length) {
        for (let j = 0; j < rolls.length; ++j) {
          const dieType = rolls[j];
          if (typeof dieType === "string") {
            const v = results[j];
            ret.push({ dieType, value: v < 0 ? undefined : v });
          }
        }
      }
    }
    return ret;
  }, [expectedRolls, rollsResults]);

  // Compute the final result
  const { result, resultError } = React.useMemo(() => {
    try {
      const result = tokens.length
        ? computeRollsResult(tokens, rollsResults, configOverrides)
        : 0;
      return { result, resultError: undefined };
    } catch (e) {
      return { result: undefined, resultError: String(e) };
    }
  }, [configOverrides, rollsResults, tokens]);

  // Dismiss the card after 5 seconds when done
  const showResult = React.useCallback(() => {
    // Skip if already set
    if (result !== undefined && !dismissTimeoutRef.current) {
      const entry = {
        formula,
        result,
        rolls: compositeRolls,
      } as const;
      dismissTimeoutRef.current = setTimeout(() => onDismiss(entry), 3000);
      setIsDone(true);
      // Speak the result
      if (speak) {
        const settings = { volume: 1, pitch: 1, rate: 1 } as const;
        Speech.speak(result.toString(), settings);
      }
      // Select winner dice
      if (tagsRef.current.length && animation) {
        console.log(
          "Winning tags " +
            tagsRef.current
              .map(({ tag, value }) => `${tag}: ${value}`)
              .join(", ")
        );
        // Play the animation
        const dice = selectedIndices
          .map((i) => {
            const roll = rolls[i]!;
            return { ...roll, pixel: getPixel(roll.pixelId) };
          })
          .filter(
            (v, i, self) => i === self.findIndex((t) => t.pixelId === v.pixelId)
          );
        // TODO incorrect!
        const animDice: typeof dice = [];
        for (const { value } of tagsRef.current) {
          const d = dice.find((d) => d.value === value);
          if (d) {
            animDice.push(d);
            dice.splice(dice.indexOf(d), 1);
          }
        }
        setTimeout(() => {
          for (const { dieType, pixel } of animDice) {
            console.log(
              `Playing animation ${animation.name} for ${pixel?.name} of type ${dieType}`
            );
            if (pixel) {
              playInstantAnimationsAsync(pixel, animation).catch((e) =>
                console.error(String(e))
              );
            }
          }
        }, 2000);
      }
    }
  }, [
    animation,
    compositeRolls,
    formula,
    onDismiss,
    result,
    rolls,
    selectedIndices,
    speak,
  ]);

  // Store the result if all rolls are available
  React.useEffect(() => {
    if (
      !tokenizerError &&
      !resultError &&
      !rollsResults.flatMap((r) => r ?? []).find((n) => n < 0)
    ) {
      showResult();
    } else {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = undefined;
      setIsDone(false);
      tagsRef.current = [];
    }
  }, [resultError, rollsResults, showResult, tokenizerError]);

  // Action sheet
  const { colors } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const showOptions = React.useCallback(
    () =>
      showActionSheetWithOptions(
        {
          options: ["Stop", "Reset", "Cancel"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          tintColor: colors.onSurface,
          destructiveColor: colors.error,
          containerStyle: { backgroundColor: colors.background },
          titleTextStyle: { color: colors.onSurfaceVariant },
          messageTextStyle: { color: colors.onSurfaceVariant },
        },
        (selectedIndex?: number) => {
          switch (selectedIndex) {
            case 0:
              showResult();
              break;
            case 1:
              onReset();
              break;
          }
        }
      ),
    [colors, onReset, showActionSheetWithOptions, showResult]
  );

  return (
    <Card
      row
      frameless
      noBorder
      vivid
      style={{ margin: 20 }}
      contentStyle={{ margin: 5, backgroundColor: colors.background }}
    >
      {tokenizerError || resultError ? (
        <View style={{ width: "100%", margin: 10 }}>
          <Text variant="bodyLarge">
            Something's wrong with the selected formula:{` '${formula}'`}
          </Text>
          <Text variant="bodyLarge" style={{ color: colors.error }}>
            {tokenizerError ?? resultError}
          </Text>
        </View>
      ) : (
        <Pressable onLongPress={() => showOptions()} style={{ width: "100%" }}>
          <CompositeRoll2
            formula={formula}
            result={isDone ? result : undefined}
            rolls={compositeRolls}
          />
        </Pressable>
      )}
    </Card>
  );
}

function RollDiceLine({
  diceTypes,
  addRoll,
}: {
  diceTypes: PixelDieType[];
  addRoll: (dieType: PixelDieType, value: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, margin: 5 }}>
      {diceTypes.map((dieType) => (
        <TouchableRipple
          key={dieType}
          onPress={() => {
            const faces = DiceUtils.getDieFaces(dieType);
            addRoll(dieType, faces[Math.floor(Math.random() * faces.length)]);
          }}
        >
          <DieWireframe dieType={dieType} size={40} />
        </TouchableRipple>
      ))}
    </View>
  );
}

function OptionsMenu({
  sizeRatio,
  onChangeSizeRatio,
  onCommitSizeRatio,
  editSettings,
  ...props
}: {
  sizeRatio: number;
  onChangeSizeRatio: (ratio: number) => void;
  onCommitSizeRatio: (ratio: number) => void;
  editSettings: () => void;
} & Omit<HeaderMenuButtonProps, "children">) {
  const paused = useAppSelector((state) => state.diceRoller.paused);
  const appDispatch = useAppDispatch();
  const { colors } = useTheme();
  return (
    <HeaderMenuButton {...props}>
      <Menu.Item
        title="Settings"
        trailingIcon={() => (
          <MaterialCommunityIcons
            name="cog-outline"
            size={24}
            color={colors.onSurface}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          editSettings();
          props.onDismiss?.();
        }}
      />
      <Menu.Item
        title={paused ? "Paused" : "Running"}
        trailingIcon={() =>
          paused ? (
            <MaterialCommunityIcons
              name="play-outline"
              size={24}
              color={colors.onSurface}
            />
          ) : (
            <MaterialIcons name="pause" size={24} color={colors.onSurface} />
          )
        }
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          appDispatch(setRollerPaused(!paused));
          props.onDismiss?.();
        }}
      />
      <Menu.Item
        title="Clear All"
        trailingIcon={() => (
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={24}
            color={colors.onSurface}
          />
        )}
        contentStyle={AppStyles.menuItemWithIcon}
        style={{ zIndex: 1 }}
        onPress={() => {
          appDispatch(hideAllRollerEntries());
          props.onDismiss?.();
        }}
      />
      <Divider />
      <Text
        variant="bodyLarge"
        style={{ paddingHorizontal: 15, marginVertical: 10 }}
      >
        Virtual Roll
      </Text>
      {[0, 1].map((i) => (
        <RollDiceLine
          key={i}
          diceTypes={AvailableDieTypes.slice(
            Math.ceil((i * AvailableDieTypes.length) / 2),
            Math.ceil(((i + 1) * AvailableDieTypes.length) / 2)
          )}
          addRoll={(dieType, value) => {
            appDispatch(addSingleRollerEntry({ pixelId: 0, dieType, value }));
            props.onDismiss?.();
          }}
        />
      ))}
      <Divider />
      <Text
        variant="bodyLarge"
        style={{ paddingHorizontal: 15, marginVertical: 10 }}
      >
        Display Size
      </Text>
      <SliderWithValue
        percentage
        value={sizeRatio}
        onValueChange={onChangeSizeRatio}
        onEndEditing={onCommitSizeRatio}
        minimumValue={0.3}
        maximumValue={1}
        style={{ marginHorizontal: 10, marginBottom: 10 }}
      />
    </HeaderMenuButton>
  );
}

function TabButton({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableRipple
      style={{
        borderRadius: 10,
        borderColor: selected ? colors.primary : colors.onSurfaceDisabled,
        borderWidth: 1,
        backgroundColor: selected ? colors.primary : colors.background,
      }}
      onPress={onPress}
    >
      <Text
        variant="bodyMedium"
        style={{
          padding: 5,
          minHeight: 24,
          color: selected ? colors.onPrimary : colors.onSurface,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </TouchableRipple>
  );
}

const RollerPage = observer(function RollerPage({
  navigation,
}: {
  navigation: DiceRollerScreenProps["navigation"];
}) {
  const store = useAppStore();
  const appDispatch = useAppDispatch();
  const central = usePixelsCentral();
  const sizeRatio = useAppSelector(
    (state) => state.appSettings.rollerCardsSizeRatio
  );
  const singleRolls = useAppSelector((state) => state.diceRoller.singleRolls);
  const compositeRolls = useAppSelector(
    (state) => state.diceRoller.compositeRolls
  );
  const rollsTimestamps = useAppSelector(
    (state) => state.diceRoller.visibleRollsIds
  );
  const visibleRolls = React.useMemo(
    () =>
      rollsTimestamps.map(
        (k) => singleRolls.entities[k] ?? compositeRolls.entities[k]
      ),
    [compositeRolls.entities, rollsTimestamps, singleRolls.entities]
  );
  const visibleSingleRolls = React.useMemo(
    () =>
      visibleRolls.filter((r) => r && "pixelId" in r) as RollerSingleEntry[],
    [visibleRolls]
  );

  // List of refs to the roll cards
  const refs = React.useRef<
    Map<number, React.RefObject<AnimatedRollCardHandle>>
  >(new Map());
  React.useEffect(() => {
    // Clear old refs
    const timestamps = Array.from(refs.current.keys());
    for (const i of timestamps) {
      if (!rollsTimestamps.includes(i)) {
        refs.current.delete(i);
      }
    }
  }, [rollsTimestamps]);

  // The formula to use (if any)
  const activeProfile = useOptionalCompositeProfile(
    useAppSelector((state) => state.diceRoller.activeProfileUuid)
  );
  const formula = activeProfile?.formula?.trim().length
    ? activeProfile?.formula
    : undefined;
  React.useEffect(() => {
    // Reset on profile or formula change
    setFormulaCounter((c) => c + 1);
  }, [activeProfile, formula]);
  const [formulaCounter, setFormulaCounter] = React.useState(0);
  const resetFormulaCard = React.useCallback(
    () => setFormulaCounter((c) => c + 1),
    []
  );
  const removeFormulaCard = React.useCallback(
    (entry: Omit<RollerCompositeEntry, "timestamp"> | undefined) => {
      setFormulaCounter((c) => c + 1);
      if (entry) {
        appDispatch(addCompositeRollerEntry(entry));
        appDispatch(setActiveRollerProfileUuid(""));
      }
    },
    [appDispatch]
  );

  // Composite profile
  const profiles = useAppSelector((state) => state.library.compositeProfiles);

  // Scroll to bottom when a new item is added
  const scrollViewRef = React.useRef<Animated.ScrollView>(null);
  React.useEffect(() => {
    // Slightly delay the scroll to make sure the new item is rendered on iOS
    const id = setTimeout(() => scrollViewRef.current?.scrollToEnd(), 0);
    return () => clearTimeout(id);
  }, [visibleRolls]);

  // Scroll to bottom when the formula is set
  React.useEffect(() => {
    if (formula) {
      scrollViewRef.current?.scrollToEnd();
    }
  }, [formula]);

  const [menuVisible, setMenuVisible] = React.useState(false);
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const height = 26;
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        onGoBack={() => navigation.goBack()}
        rightElement={() => (
          <View
            style={{
              flexDirection: "row",
              width: 80,
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {/* Make bigger pressable area */}
            <Pressable
              style={{ padding: 7 }}
              onPress={() => {
                for (const d of store.getState().pairedDice.paired) {
                  central.scheduleOperation(d.pixelId, { type: "blink" });
                }
              }}
            >
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={height - 8}
                color={colors.onSurface}
                style={{
                  ...iOSBorderRadiusFix,
                  padding: 2,
                  borderRadius: height / 2,
                  borderWidth: 1,
                  borderColor: colors.onSurface,
                  backgroundColor: colors.background,
                  textAlign: "center",
                  textAlignVertical: "center",
                }}
              />
            </Pressable>
            <OptionsMenu
              visible={menuVisible}
              sizeRatio={sizeRatio}
              onChangeSizeRatio={(r) => {
                for (const ref of refs.current.values()) {
                  ref.current?.overrideWidth(r * screenWidth);
                }
              }}
              onCommitSizeRatio={(r) => appDispatch(setRollerCardsSizeRatio(r))}
              contentStyle={{ width: 220 }}
              onShowMenu={() => setMenuVisible(true)}
              onDismiss={() => setMenuVisible(false)}
              editSettings={() => navigation.navigate("diceRollerSettings")}
            />
          </View>
        )}
      >
        Roller
      </PageHeader>
      <View style={{ marginBottom: 10 }}>
        <ScrollView
          horizontal
          contentContainerStyle={{
            minWidth: "100%",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {profiles.ids.map((id) => {
            const uuid = id as string;
            const profile = profiles.entities[uuid];
            const selected = activeProfile?.uuid === uuid;
            return (
              !!profile?.formula?.trim().length && (
                <TabButton
                  key={uuid}
                  selected={selected}
                  title={profile.formula}
                  onPress={() => {
                    appDispatch(
                      setActiveRollerProfileUuid(selected ? "" : uuid)
                    );
                    if (!selected) {
                      // Defer scrolling after the next render
                      setTimeout(() => scrollViewRef.current?.scrollToEnd(), 0);
                    }
                  }}
                />
              )
            );
          })}
        </ScrollView>
      </View>
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 10, overflow: "visible" }}
        removeClippedSubviews={false}
      >
        <Banner
          visible={!rollsTimestamps.length}
          style={{ marginHorizontal: 10 }}
        >
          Roll any connected die to get started!
        </Banner>
        <View style={{ overflow: "visible" }}>
          {visibleRolls.map((roll, i) => {
            if (!roll) return null;
            let ref = refs.current.get(roll.timestamp);
            if (!ref) {
              ref = React.createRef();
              refs.current.set(roll.timestamp, ref);
            }
            return (
              <AnimatedRollCard
                key={roll.timestamp}
                ref={ref}
                width={sizeRatio * screenWidth}
                position={i % 2 ? "right" : "left"}
                onRemove={
                  menuVisible
                    ? undefined
                    : () => {
                        appDispatch(hideRollerEntry(roll.timestamp));
                        bottomPadding.value = sizeRatio * screenWidth;
                        bottomPadding.value = withTiming(0, {
                          duration: 300,
                        });
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
                      }
                }
              >
                {({ width }) =>
                  "pixelId" in roll ? (
                    <SingleRoll
                      dieType={roll.dieType}
                      faceValue={roll.value}
                      width={width}
                    />
                  ) : (
                    <CompositeRoll
                      formula={roll.formula}
                      result={roll.result}
                      rolls={roll.rolls}
                      width={width}
                    />
                  )
                }
              </AnimatedRollCard>
            );
          })}
        </View>
        {/* Padding to have a smooth scroll */}
        <Animated.View style={animatedPadding} />
      </ScrollView>
      {formula && (
        <FormulaCard
          key={formula + formulaCounter} // Create new component when the formula changes
          formula={formula}
          speak={activeProfile?.speakResult}
          animation={activeProfile?.resultAnimation}
          rolls={visibleSingleRolls}
          onDismiss={removeFormulaCard}
          onReset={resetFormulaCard}
        />
      )}
    </View>
  );
});

export function DiceRollerScreen({ navigation }: DiceRollerScreenProps) {
  return (
    <AppBackground>
      <RollerPage navigation={navigation} />
    </AppBackground>
  );
}

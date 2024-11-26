import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  DiceUtils,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import * as Haptics from "expo-haptics";
import React from "react";
import { View, ScrollView, useWindowDimensions, Pressable } from "react-native";
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
import { AppStore } from "~/app/store";
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
import { GradientButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { AvailableDieTypes } from "~/features/dice/AvailableDieTypes";
import {
  calculateFinalResult,
  RollResults,
  tallyRolls,
  Token,
  tokenize,
} from "~/features/dice-notation";
import { defaultPlugins } from "~/features/dice-notation/createDiceRoller";
import { SIMPLE_DIE_ROLL } from "~/features/dice-notation/rules/simpleDieRoll";
import { CoreTokenTypes } from "~/features/dice-notation/tokens";
import {
  getDefaultRollConfigOptions,
  getFinalRollConfig,
  RollConfig,
} from "~/features/dice-notation/util/rollConfig";
import {
  addRollerEntry,
  DatedRoll,
  hideAllRollerEntries,
  hideRollerEntry,
  setRollerCardsSizeRatio,
  setRollerPaused,
} from "~/features/store";

function _rollDice(tokens: Token[], rollConfig: RollConfig): RollResults {
  const plugins = defaultPlugins;
  return tokens.map((token) => {
    switch (token.type) {
      case CoreTokenTypes.CloseParen:
      case CoreTokenTypes.OpenParen:
      case CoreTokenTypes.Operator:
        return null;
      case CoreTokenTypes.DiceRoll:
        return plugins[token.detailType].roll(token.detail, rollConfig);
    }
  });
}

type DieTypeRolls = (PixelDieType | number)[] | null;

function getPixelsDiceList(
  tokens: Token[],
  rollConfig: RollConfig
): DieTypeRolls[] {
  const plugins = defaultPlugins;
  return tokens.map((token) =>
    token.type !== CoreTokenTypes.DiceRoll
      ? null
      : token.detailType !== SIMPLE_DIE_ROLL
        ? plugins[token.detailType].roll(token.detail, rollConfig)
        : // Overriding the roll function to estimate the die type
          Array(token.detail.count).fill(
            DiceUtils.estimateDieType(token.detail.numSides)
          )
  );
}

function waitForRollsAsync(
  store: AppStore,
  diceList: DieTypeRolls[]
): Promise<RollResults> {
  return new Promise<RollResults>((resolve) => {
    const ourRolls: DatedRoll[] = [];
    let lastUsedRoll = store.getState().diceRoller.allRolls.ids.at(-1);
    const unsubscribe = store.subscribe(() => {
      const { allRolls: diceRollerRolls } = store.getState().diceRoller;
      // Defer computation to not slow down the UI
      setTimeout(() => {
        const lastRoll = diceRollerRolls.ids.at(-1);
        const roll = diceRollerRolls.entities[lastRoll ?? -1];
        if (roll && (!lastUsedRoll || lastRoll !== lastUsedRoll)) {
          console.log("Got new roll:" + JSON.stringify(roll));
          lastUsedRoll = lastRoll;
          ourRolls.push(roll);
          // Build roll results
          const ourRollsCopy = [...ourRolls];
          const results: RollResults = [];
          for (const arr of diceList) {
            if (arr) {
              const rolls: number[] = [];
              results.push(rolls);
              for (const dieType of arr) {
                if (typeof dieType === "number") {
                  // We got a number, use it as the roll
                  rolls.push(dieType);
                  continue;
                }
                const index = ourRollsCopy.findIndex(
                  (r) => r.dieType === dieType
                );
                if (index >= 0) {
                  rolls.push(ourRollsCopy[index].value);
                  ourRollsCopy.splice(index, 1);
                } else {
                  // Abort and wait for the next roll
                  console.log("Waiting for roll of type " + dieType);
                  return;
                }
              }
            } else {
              results.push(null);
            }
          }
          unsubscribe();
          resolve(results);
        }
      }, 100);
    });
  });
}

async function testDiceNotationAsync(
  store: AppStore,
  formula: string,
  setExpectedRolls: (diceType: PixelDieType[]) => void
): Promise<number> {
  const rollConfig = getFinalRollConfig(getDefaultRollConfigOptions());
  const tokens = tokenize(formula);
  console.log(`Tokenized ${formula}:` + JSON.stringify(tokens, null, 2));
  const diceList = getPixelsDiceList(tokens, rollConfig);
  console.log(`Dice list: ${diceList.join(", ")}`);
  setExpectedRolls(diceList.flat().filter((x) => !!x) as PixelDieType[]);
  const rolls = await waitForRollsAsync(store, diceList);
  // const rolls = rollDice(tokens, rollConfig);
  console.log(`Rolled ${formula}: ${JSON.stringify(rolls, null, 2)}`);
  const rollTotals = tallyRolls(tokens, rolls, rollConfig);
  const result = calculateFinalResult(tokens, rollTotals);
  console.log(`Result=${result}`);
  return result;
}

interface AnimatedRollCardHandle {
  overrideWidth: (w: number) => void;
}

const AnimatedRollCard = React.forwardRef(function AnimatedRollCard(
  {
    width: widthProp,
    faceValue,
    dieType,
    position,
    onRemove,
  }: {
    width: number;
    faceValue: number;
    dieType: PixelDieType;
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
              marginLeft: width * 0.01,
            }}
          >
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
          </Pressable>
        </Card>
      </Animated.View>
    </GestureDetector>
  );
});

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
  ...props
}: {
  sizeRatio: number;
  onChangeSizeRatio: (ratio: number) => void;
  onCommitSizeRatio: (ratio: number) => void;
} & Omit<HeaderMenuButtonProps, "children">) {
  const paused = useAppSelector((state) => state.diceRoller.paused);
  const appDispatch = useAppDispatch();
  const { colors } = useTheme();
  return (
    <HeaderMenuButton {...props}>
      <Text variant="bodyLarge" style={{ paddingHorizontal: 15 }}>
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
      <Divider />
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
      <Divider />
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
            appDispatch(addRollerEntry({ pixelId: 0, dieType, value }));
            props.onDismiss?.();
          }}
        />
      ))}
      <Divider />
    </HeaderMenuButton>
  );
}

function RollerPage({
  navigation,
}: {
  navigation: DiceRollerScreenProps["navigation"];
}) {
  const store = useAppStore();
  const appDispatch = useAppDispatch();
  const sizeRatio = useAppSelector(
    (state) => state.appSettings.rollerCardsSizeRatio
  );
  const allRolls = useAppSelector((state) => state.diceRoller.allRolls);
  const rollsTimestamps = useAppSelector(
    (state) => state.diceRoller.visibleRolls
  );
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

  const formula = "2d20+3";
  const [result, setResult] = React.useState<string>();

  const scrollViewRef = React.useRef<Animated.ScrollView>(null);
  // Scroll to bottom when a new item is added
  React.useEffect(() => {
    // Slightly delay the scroll to make sure the new item is rendered on iOS
    const id = setTimeout(() => scrollViewRef.current?.scrollToEnd(), 0);
    return () => clearTimeout(id);
  }, [allRolls]);

  const [menuVisible, setMenuVisible] = React.useState(false);
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  const { width: screenWidth } = useWindowDimensions();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        onGoBack={() => navigation.goBack()}
        rightElement={() => (
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
          />
        )}
      >
        Roller
      </PageHeader>
      <GradientButton
        style={{ margin: 10 }}
        onPress={() => {
          testDiceNotationAsync(store, formula, (dieTypes) =>
            setResult("Expected rolls: " + dieTypes.join(", "))
          )
            .then((r) => setResult(r.toString()))
            .catch((e) => setResult(e.toString()));
        }}
      >
        {result ?? `Test formula: "${formula}"`}
      </GradientButton>
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
          {rollsTimestamps.map((k, i) => {
            const roll = allRolls.entities[k];
            let ref = refs.current.get(k);
            if (!ref) {
              ref = React.createRef();
              refs.current.set(k, ref);
            }
            return (
              roll && (
                <AnimatedRollCard
                  key={roll.timestamp}
                  ref={ref}
                  width={sizeRatio * screenWidth}
                  faceValue={roll.value}
                  dieType={roll.dieType}
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
                />
              )
            );
          })}
        </View>
        {/* Padding to have a smooth scroll */}
        <Animated.View style={animatedPadding} />
      </ScrollView>
    </View>
  );
}
export function DiceRollerScreen({ navigation }: DiceRollerScreenProps) {
  return (
    <AppBackground>
      <RollerPage navigation={navigation} />
    </AppBackground>
  );
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
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

import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import { HeaderMenuButton } from "~/components/HeaderMenuButton";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { Banner } from "~/components/banners";
import { DieWireframe } from "~/components/icons";
import { useWatchedPixels } from "~/hooks";
import { DiceRollerScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

const diceTypes = [
  "d20",
  "d12",
  "d00",
  "d10",
  "d8",
  "d6",
  "d4",
] as PixelDieType[];

function AnimatedRollCard({
  faceValue,
  dieType,
  width,
  position = "left",
  onRemove,
}: {
  faceValue: number;
  dieType: PixelDieType;
  width: number;
  position?: "left" | "right";
  onRemove?: () => void;
}) {
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
    };
  }, [offset, position, screenWidth, width]);
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

function RollerPage({
  navigation,
}: {
  navigation: DiceRollerScreenProps["navigation"];
}) {
  const [sizeRatio, setSizeRatio] = React.useState(0.5);
  const [rolls, setRolls] = React.useState<
    { key: number; dieType: PixelDieType; value: number }[]
  >([]);

  const addRoll = React.useCallback((dieType: PixelDieType, value: number) => {
    const key = Date.now();
    setRolls((rolls) => [...rolls, { key, dieType, value }]);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const pixels = useWatchedPixels();
  React.useEffect(() => {
    const disposers: (() => void)[] = [];
    for (const pixel of pixels) {
      const dieType = pixel.dieType;
      const onRoll = (roll: number) => addRoll(dieType, roll);
      disposers.push(() => pixel.removeEventListener("roll", onRoll));
      pixel.addEventListener("roll", onRoll);
    }
    return () => {
      for (const d of disposers) d();
    };
  }, [addRoll, pixels]);

  const [menuVisible, setMenuVisible] = React.useState(false);
  const bottomPadding = useSharedValue(0);
  const animatedPadding = useAnimatedStyle(() => ({
    height: bottomPadding.value,
  }));

  const scrollViewRef = React.useRef<Animated.ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * sizeRatio;
  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        onGoBack={() => navigation.goBack()}
        rightElement={() => (
          <HeaderMenuButton
            visible={menuVisible}
            contentStyle={{ width: 220 }}
            onShowMenu={() => setMenuVisible(true)}
            onDismiss={() => setMenuVisible(false)}
          >
            <Text variant="bodyLarge" style={{ paddingHorizontal: 15 }}>
              Display Size
            </Text>
            <SliderWithValue
              percentage
              value={sizeRatio}
              onValueChange={setSizeRatio}
              minimumValue={0.3}
              maximumValue={1}
              style={{ marginHorizontal: 10, marginBottom: 10 }}
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
                setRolls([]);
                setMenuVisible(false);
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
                diceTypes={diceTypes.slice(
                  (i * diceTypes.length) / 2,
                  ((i + 1) * diceTypes.length) / 2
                )}
                addRoll={(d, v) => {
                  addRoll(d, v);
                  setMenuVisible(false);
                }}
              />
            ))}
          </HeaderMenuButton>
        )}
      >
        Roller
      </PageHeader>
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 10, overflow: "visible" }}
        removeClippedSubviews={false}
      >
        <Banner visible={!rolls.length} style={{ marginHorizontal: 10 }}>
          Roll any connected die to get started!
        </Banner>
        <View style={{ overflow: "visible" }}>
          {rolls.map((roll, i) => (
            <AnimatedRollCard
              key={roll.key}
              faceValue={roll.value}
              dieType={roll.dieType}
              width={cardWidth}
              position={i % 2 ? "right" : "left"}
              onRemove={
                menuVisible
                  ? undefined
                  : () => {
                      setRolls(rolls.filter((_, j) => j !== i));
                      bottomPadding.value = cardWidth;
                      bottomPadding.value = withTiming(0, { duration: 300 });
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );
                    }
              }
            />
          ))}
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

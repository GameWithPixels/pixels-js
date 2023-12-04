import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleProp,
  useWindowDimensions,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Modal,
  ModalProps,
  Portal,
  Switch,
  SwitchProps,
  Text,
  ThemeProvider,
  useTheme,
} from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "./AppBackground";
import { GradientButton, OutlineButton } from "./buttons";
import { DieWireframeCard } from "./cards";
import { makeTransparent } from "./utils";

import { getBottomSheetBackgroundStyle } from "~/themes";

function LightUpYourGameImage({
  height,
  style,
  ...props
}: { height?: number } & Omit<ImageProps, "source">) {
  return (
    <Image
      contentFit="contain"
      source={require("#/temp/pixels-light-up-your-game.png")}
      style={[{ height, marginVertical: 20 }, style]}
      {...props}
    />
  );
}

function Slide({
  children,
  title,
  style,
  contentStyle,
  ...props
}: { title?: string; contentStyle?: StyleProp<ViewStyle> } & ViewProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        makeTransparent(colors.primary, 0.2),
        makeTransparent(colors.secondary, 0.2),
      ]}
    >
      <View
        style={[
          {
            width,
            height: "100%",
            flex: 1,
            paddingHorizontal: 30,
            paddingTop: title ? 50 : 0,
            paddingBottom: 40,
            justifyContent: "space-between",
          },
          style,
        ]}
        {...props}
      >
        {title && (
          <Text
            variant="titleLarge"
            style={{ alignSelf: "center" }}
            children={title}
          />
        )}
        <View style={[{ flexShrink: 1, flexGrow: 1 }, contentStyle]}>
          {children}
        </View>
      </View>
    </LinearGradient>
  );
}

function WelcomeSlide({ onNext }: { onNext: () => void }) {
  return (
    <Slide>
      <View style={{ flexGrow: 1, justifyContent: "space-evenly" }}>
        <LightUpYourGameImage style={{ height: "30%", marginTop: 20 }} />
        <Text variant="titleMedium" style={{ alignSelf: "center" }}>
          Welcome to the Pixels app!
        </Text>
      </View>
      <GradientButton
        style={{ width: "50%", alignSelf: "center" }}
        onPress={onNext}
      >
        Start
      </GradientButton>
    </Slide>
  );
}

function HealthSlide({ onNext }: { onNext: () => void }) {
  return (
    <Slide title="Health & Safety Information">
      <ScrollView contentContainerStyle={{ gap: 30, paddingBottom: 10 }}>
        <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
          <Text>⚠️</Text>
          <View style={{ flex: 1, gap: 20 }}>
            <Text variant="titleSmall" style={{ textTransform: "uppercase" }}>
              Photosensitive / Epilepsy Warning
            </Text>
            <Text style={{ marginBottom: 20 }}>
              Some individuals may experience epileptic seizures or blackouts
              when exposed to certain light patterns or flashing lights. If you
              or anyone in your family has an epileptic condition or has
              seizures of any kind, consult your physician before using Pixels
              Dice. When opening a Pixels Dice case for the first time, a gentle
              cycling of rainbow colors will display from the dice.
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>❌</Text>
          <View style={{ flex: 1, gap: 20 }}>
            <Text variant="titleSmall">
              DO NOT use Pixels Dice if you experience any of the following when
              exposed to flashing lights:
            </Text>
            <Text>
              {"• dizziness\n" +
                "• extreme headache or migraine\n" +
                "• disorientation or confusion\n" +
                "• altered vision\n" +
                "• loss of awareness\n" +
                "• seizures or convulsions\n" +
                "• any involuntary movement"}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>🛑</Text>
          <Text style={{ flex: 1 }} variant="titleSmall">
            STOP using Pixels Dice and app immediately if you experience and of
            the above or symptoms such as lightheadedness, nausea, or motion
            sickness.
          </Text>
        </View>
      </ScrollView>
      <GradientButton onPress={onNext}>I Understand</GradientButton>
    </Slide>
  );
}

function SwitchWithLabel({ children, ...props }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text variant="bodyLarge" children={children} />
      <Switch
        thumbColor={colors.onSurface}
        trackColor={{
          false: colors.onSurfaceDisabled,
          true: colors.primary,
        }}
        {...props}
      />
    </View>
  );
}

function SettingsSlide({ onNext }: { onNext: () => void }) {
  const [disableAnim, setDisableAnim] = React.useState(false);
  const [slowAnim, setSlowAnim] = React.useState(false);
  const [lowBrightness, setLowBrightness] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <Slide title="Light Sensitive Settings">
      <LightUpYourGameImage height={80} />
      <View style={{ flexGrow: 1, gap: 40 }}>
        <Text>
          The settings below let you customize the app and dice luminosity and
          flashes. You can always change them later in the app settings.
        </Text>
        <View
          style={{
            gap: 10,
            padding: 10,
            paddingLeft: 20,
            backgroundColor: colors.backdrop,
            borderRadius,
          }}
        >
          <SwitchWithLabel value={disableAnim} onValueChange={setDisableAnim}>
            Hide Animations in App
          </SwitchWithLabel>
          <SwitchWithLabel value={slowAnim} onValueChange={setSlowAnim}>
            Slower Animations
          </SwitchWithLabel>
          <SwitchWithLabel
            value={lowBrightness}
            onValueChange={setLowBrightness}
          >
            Lower Dice Brightness
          </SwitchWithLabel>
        </View>
      </View>
      <GradientButton onPress={onNext}>Next</GradientButton>
    </Slide>
  );
}

function TurnOnDiceModal({
  visible,
  onDismiss,
}: {
  onDismiss: () => void;
  visible: boolean;
}) {
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
  const colors = theme.colors;
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["92%"]}
      onDismiss={onDismiss}
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
        <BottomSheetScrollView
          style={{ marginBottom: bottom }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={makeTransparent(colors.onBackground, 0.5)}
            style={{ position: "absolute", top: 0, right: 20 }}
            onPress={() => sheetRef.current?.dismiss()}
          />
          <LightUpYourGameImage height={100} />
          <Text style={{ color: colors.onBackground }}>
            Text and images explaining how to turn on dice.
          </Text>
          {range(20).map((i) => (
            <Text key={i} style={{ color: colors.onBackground }}>
              Adding a lot of text to enable content scrolling.
            </Text>
          ))}
          <LightUpYourGameImage height={100} />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

function ScanSlide({
  pixels,
  onNext,
}: {
  pixels: Pixel[];
  onNext: () => void;
}) {
  const [showTurnOn, setShowTurnOn] = React.useState(false);
  const { colors } = useTheme();
  return (
    <Slide
      title="Pair Your Dice"
      contentStyle={{
        paddingTop: 20,
        justifyContent: "space-between",
      }}
    >
      <View style={{ width: "100%" }}>
        <Image
          contentFit="cover"
          style={{
            width: "100%",
            height: 60,
          }}
          source={require("#/temp/dice-row.jpg")}
        />
      </View>
      <View style={{ gap: 20 }}>
        <Text>
          The app needs to connect to your dice to let you customize them.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <Text>Looking for Pixels...</Text>
          <ActivityIndicator />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        {pixels.map((p) => (
          <DieWireframeCard key={p.pixelId} dieType={p.dieType}>
            {p.name}
          </DieWireframeCard>
        ))}
      </ScrollView>
      <View style={{ marginTop: 10, gap: 20 }}>
        <OutlineButton
          style={{ backgroundColor: colors.backdrop }}
          onPress={() => setShowTurnOn(true)}
        >
          I Don't See All My Dice
        </OutlineButton>
        <GradientButton onPress={onNext}>All My Dice Are Here</GradientButton>
      </View>
      <TurnOnDiceModal
        visible={showTurnOn}
        onDismiss={() => setShowTurnOn(false)}
      />
    </Slide>
  );
}

function UpdateDiceSlide({
  pixels,
  onNext,
}: {
  pixels: Pixel[];
  onNext: () => void;
}) {
  const [step, setStep] = React.useState<"wait" | "update" | "done">("wait");
  const [dfuStatuses, setDfuStatuses] = React.useState(
    pixels.map((_, i) => ((i + 1) % 2 ? 200 : 0) as number)
  ); // 200 = already up to date
  React.useEffect(() => {
    if (step === "update") {
      const id = setInterval(
        () =>
          setDfuStatuses((statuses) => {
            const i = statuses.findIndex((s) => s <= 100);
            if (i === -1) {
              clearInterval(id);
              setStep("done");
              return statuses;
            } else {
              const copy = [...statuses];
              copy[i] += 5; // Go up to 105 to show "✅"
              return copy;
            }
          }),
        200
      );
      return () => clearInterval(id);
    }
  }, [step]);
  const getStatus = (status: number) => {
    if (status <= 0) {
      return "";
    } else if (status >= 100) {
      return "✅";
    } else {
      return `Updating: ${status}%`;
    }
  };
  const outdatedCount = dfuStatuses.filter((s) => s <= 100).length;
  const { colors } = useTheme();
  return (
    <Slide title="Update Dice Firmware">
      <LightUpYourGameImage height={50} />
      <View style={{ gap: 20 }}>
        <Text variant="bodyLarge">
          We have a software update for your dice!
        </Text>
        <Text variant="bodyLarge">
          We recommend to update them so they work properly with the app. It
          takes less than 20 seconds per die.
        </Text>
      </View>
      {outdatedCount ? (
        <Animated.ScrollView
          style={{ marginVertical: 10 }}
          contentContainerStyle={{
            padding: 10,
            gap: 10,
          }}
        >
          {pixels.map(
            (p, i) =>
              dfuStatuses[i] <= 100 && (
                <Animated.View
                  key={p.pixelId}
                  exiting={FadeOut.delay(1200).duration(300)}
                  layout={CurvedTransition.delay(1400)}
                >
                  <DieWireframeCard dieType={p.dieType}>
                    {p.name}
                    {dfuStatuses[i] > 0 && dfuStatuses[i] < 100 ? " - " : "  "}
                    {getStatus(dfuStatuses[i])}
                  </DieWireframeCard>
                </Animated.View>
              )
          )}
          {/* Add some bottom padding so animated card don't get cut off during their exit animation */}
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      ) : (
        <Animated.View
          entering={FadeIn.delay(1600).duration(300)}
          style={{ flexGrow: 1, paddingTop: 40 }}
        >
          <Text variant="bodyLarge">All your dice are up-to-date!</Text>
        </Animated.View>
      )}
      {step === "wait" && (
        <Animated.View exiting={FadeOut}>
          <GradientButton onPress={() => setStep("update")}>
            Update {outdatedCount} Dice
          </GradientButton>
        </Animated.View>
      )}
      {step === "done" && (
        <Animated.View entering={FadeIn.delay(1600).duration(300)}>
          <GradientButton onPress={onNext}>Next</GradientButton>
        </Animated.View>
      )}
      {step === "wait" && (
        <Button
          textColor={makeTransparent(colors.onBackground, 0.5)}
          style={{ position: "absolute", top: -70, right: -20 }} // TODO better positioning
          onPress={onNext}
        >
          Skip
        </Button>
      )}
    </Slide>
  );
}

function ReadySlide({ onDone }: { onDone: () => void }) {
  return (
    <Slide>
      <View style={{ flex: 1, justifyContent: "space-evenly" }}>
        <View style={{ gap: 20 }}>
          <Text variant="titleMedium">Customize Your Dice</Text>
          <Text>
            The Pixels app automatically connects to your dice and let you
            customize how they light up.
          </Text>
          <Text>
            You can make them play text or sound on your phone and have them
            make web requests.
          </Text>
        </View>
        <LightUpYourGameImage height={80} />
        <View style={{ gap: 20 }}>
          <Text variant="titleMedium">Customize Your App</Text>
          <Text>
            You can configure how the app display your dice to your liking.
            Explore the different view options!
          </Text>
        </View>
      </View>
      <GradientButton onPress={onDone}>Go</GradientButton>
    </Slide>
  );
}

export function IntroSlides({
  pixels,
  style,
  onDismiss,
  ...props
}: { pixels: Pixel[] } & Omit<ModalProps, "children">) {
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    if (scrollRef && !props.visible) {
      // Reset when hiding
      scrollRef.current?.scrollTo({ x: 0 });
      setIndex(0);
    }
  }, [props.visible]);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });
  return (
    <Portal>
      <Modal
        dismissable={false}
        onDismiss={onDismiss}
        contentContainerStyle={[{ width, height: "100%" }, style]}
        {...props}
      >
        <AppBackground>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            onScroll={({ nativeEvent: { contentOffset } }) =>
              setIndex(Math.round(contentOffset.x / width))
            }
            scrollEventThrottle={100}
          >
            <WelcomeSlide onNext={() => scrollTo(1)} />
            <HealthSlide onNext={() => scrollTo(2)} />
            <SettingsSlide onNext={() => scrollTo(3)} />
            <ScanSlide pixels={pixels} onNext={() => scrollTo(4)} />
            <UpdateDiceSlide pixels={pixels} onNext={() => scrollTo(5)} />
            <ReadySlide onDone={() => onDismiss?.()} />
          </ScrollView>
          <View
            style={{
              position: "absolute",
              width: "100%",
              height: 40,
              bottom: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Text>{index + 1} / 6</Text>
            {/* {range(6).map((i) => (
              <View
                key={i}
                style={{
                  width: 10,
                  aspectRatio: 1,
                  borderRadius: 100,
                  backgroundColor:
                    i === index
                      ? colors.onBackground
                      : makeTransparent(colors.onBackground, 0.2),
                }}
              />
            ))} */}
          </View>
        </AppBackground>
      </Modal>
    </Portal>
  );
}

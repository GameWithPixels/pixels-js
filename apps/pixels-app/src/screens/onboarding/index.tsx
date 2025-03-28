import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import {
  BluetoothNotAuthorizedError,
  Pixel,
  PixelDieType,
  ScannedDevicesRegistry,
  ScannedPixel,
  usePixelProp,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps } from "expo-image";
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
  Button,
  ButtonProps,
  Text as PaperText,
  Switch,
  SwitchProps,
  TextProps,
  ThemeProvider,
  useTheme,
} from "react-native-paper";
import Animated, {
  AnimatedProps,
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppSelector, useAppStore } from "~/app/hooks";
import {
  getBluetoothScanErrorMessage,
  getNoAvailableDiceMessage,
} from "~/app/messages";
import { OnboardingScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { AppBackground } from "~/components/AppBackground";
import { DfuFilesGate } from "~/components/DfuFilesGate";
import { NavigationRoot } from "~/components/NavigationRoot";
import { PixelDfuList } from "~/components/PixelDfuList";
import { ScannedPixelsCount } from "~/components/ScannedPixelsCount";
import { TurnOnDiceHelp } from "~/components/TunOnDiceHelp";
import { AnimatedText } from "~/components/animated";
import {
  AnimatedGradientButton,
  GradientButton,
  TightTextButton,
} from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { getDieDfuAvailability, pairDie } from "~/features/dice";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  getDieTypeAndColorwayLabel,
  getFirmwareUpdateAvailable,
  getKeepAllDiceUpToDate,
  getKeepDiceNearDevice,
  getPixelStatusLabel,
} from "~/features/profiles";
import { setShowOnboarding } from "~/features/store";
import {
  useBatteryStateLabel,
  useBottomSheetBackHandler,
  useFlashAnimationStyleOnRoll,
  usePixelScanner,
  usePixelScannerStatus,
  usePixelsCentral,
  useRegisteredPixels,
  useRollStateLabel,
  useUpdateDice,
} from "~/hooks";
import { usePixelRssiLabel } from "~/hooks/usePixelRssiLabel";

function LightUpYourGameImage({
  height = 80,
  marginVertical,
  style,
  ...props
}: { height?: number; marginVertical?: number } & Omit<ImageProps, "source">) {
  return (
    <Image
      contentFit="contain"
      source={require("#/temp/pixels-light-up-your-game.png")}
      style={[{ height, marginVertical }, style]}
      {...props}
    />
  );
}

function SkipButton({
  ...props
}: Omit<ButtonProps, "children" | "style" | "textColor">) {
  return (
    <Button
      style={{ position: "absolute", top: -70, right: -20 }} // TODO better positioning
      {...props}
    >
      Skip
    </Button>
  );
}

function Title({ children }: React.PropsWithChildren) {
  return (
    <PaperText
      variant="titleLarge"
      style={AppStyles.selfCentered}
      children={children}
    />
  );
}

function Text({ style, ...props }: Omit<TextProps<never>, "variant">) {
  return (
    <PaperText
      variant="bodyLarge"
      style={[{ textAlign: "center" }, style]}
      {...props}
    />
  );
}

function SmallText(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodySmall" {...props} />;
}

function AnimatedDieWireframeCard({
  children,
  dieType,
  style,
  ...props
}: AnimatedProps<Omit<ViewProps, "children">> &
  React.PropsWithChildren<{ dieType: PixelDieType }>) {
  return (
    <Animated.View
      style={[{ flexDirection: "row", alignItems: "center", gap: 20 }, style]}
      {...props}
    >
      <DieWireframe size={40} dieType={dieType} />
      {typeof children === "string" ? (
        <Text style={{ textAlign: "auto" }} children={children} />
      ) : (
        <View style={{ flex: 1, flexGrow: 1 }} children={children} />
      )}
    </Animated.View>
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
  return (
    <View
      style={[
        {
          width,
          height: "100%",
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: title ? 50 : 0,
          paddingBottom: 40,
          justifyContent: "space-between",
        },
        style,
      ]}
      {...props}
    >
      {title && <Title children={title} />}
      <View style={[{ flexShrink: 1, flexGrow: 1 }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

function WelcomeSlide({ onNext }: { onNext: () => void }) {
  return (
    <Slide>
      <View style={{ flexGrow: 1, justifyContent: "space-evenly" }}>
        <LightUpYourGameImage style={{ height: "30%", marginTop: 20 }} />
        <Title>Welcome to the Pixels app!</Title>
      </View>
      <GradientButton sentry-label="onboarding-start" onPress={onNext}>
        Start
      </GradientButton>
    </Slide>
  );
}

function HealthSlide({ onNext }: { onNext: () => void }) {
  return (
    <Slide title="Health & Safety Information">
      <ScrollView
        alwaysBounceVertical={false}
        style={{ marginTop: 20 }}
        contentContainerStyle={{ gap: 30, paddingVertical: 10 }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
          <Text>⚠️</Text>
          <View style={{ flex: 1, gap: 20 }}>
            <PaperText
              variant="bodyLarge"
              style={{ textTransform: "uppercase" }}
            >
              Photosensitive / Epilepsy Warning
            </PaperText>
            <PaperText>
              Some individuals may experience epileptic seizures or blackouts
              when exposed to certain light patterns or flashing lights. If you
              or anyone in your family has an epileptic condition or has
              seizures of any kind, consult your physician before using Pixels
              Dice. When opening a Pixels Dice case for the first time, a gentle
              cycling of rainbow colors will display from the dice.
            </PaperText>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>❌</Text>
          <View style={{ flex: 1, gap: 20 }}>
            <PaperText variant="titleSmall">
              DO NOT use Pixels Dice if you experience any of the following when
              exposed to flashing lights:
            </PaperText>
            <PaperText>
              {"• dizziness\n" +
                "• extreme headache or migraine\n" +
                "• disorientation or confusion\n" +
                "• altered vision\n" +
                "• loss of awareness\n" +
                "• seizures or convulsions\n" +
                "• any involuntary movement"}
            </PaperText>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>🛑</Text>
          <PaperText style={{ flex: 1 }} variant="titleSmall">
            STOP using Pixels Dice and app immediately if you experience any of
            the above or symptoms such as lightheadedness, nausea, or motion
            sickness.
          </PaperText>
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
      <Text children={children} />
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SettingsSlide({ onNext }: { onNext: () => void }) {
  const [disableAnim, setDisableAnim] = React.useState(false);
  const [slowAnim, setSlowAnim] = React.useState(false);
  const [lowBrightness, setLowBrightness] = React.useState(false);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <Slide title="Light Sensitive Settings">
      <LightUpYourGameImage marginVertical={60} />
      <View style={{ flexGrow: 1, gap: 60 }}>
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

function HelpTurnOnDiceModal({
  visible,
  onDismiss,
}: {
  onDismiss: () => void;
  visible: boolean;
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

  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["92%"]}
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <ThemeProvider theme={theme}>
        <BottomSheetScrollView
          style={{ marginBottom: bottom }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
        >
          <LightUpYourGameImage />
          <TurnOnDiceHelp />
          <LightUpYourGameImage />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

function PixelItem({
  scannedPixel,
  pixel,
}: {
  scannedPixel: ScannedPixel;
  pixel: Pixel;
}) {
  const status = usePixelStatus(pixel);
  const name = usePixelProp(pixel, "name");
  const dieType = usePixelProp(pixel, "dieType");
  const batteryLabel = useBatteryStateLabel(pixel);
  const rssiLabel = usePixelRssiLabel(pixel);
  const rollLabel = useRollStateLabel(pixel);
  const animStyle = useFlashAnimationStyleOnRoll(pixel);
  const { colors } = useTheme();
  return (
    <AnimatedDieWireframeCard
      entering={FadeIn.duration(300)}
      dieType={dieType ?? "unknown"}
      style={animStyle}
    >
      <Text style={{ textAlign: "auto" }}>
        {name ?? scannedPixel.name + "."}
      </Text>
      <SmallText>
        {getDieTypeAndColorwayLabel(status === "ready" ? pixel : scannedPixel)}
      </SmallText>
      <SmallText>
        {status === "ready" ? (
          <>
            {batteryLabel && (
              <>
                <MaterialCommunityIcons
                  name="battery"
                  size={16}
                  color={colors.onSurface}
                />{" "}
                {batteryLabel}
              </>
            )}
            {rssiLabel && (
              <>
                <MaterialCommunityIcons
                  name="signal"
                  size={16}
                  color={colors.onSurface}
                />{" "}
                {rssiLabel}
              </>
            )}
            {((rssiLabel ?? batteryLabel) && rollLabel ? ", " : "") +
              (rollLabel ?? "")}
          </>
        ) : (
          getPixelStatusLabel(status)
        )}
      </SmallText>
    </AnimatedDieWireframeCard>
  );
}

function ScanSlide({ onNext }: { onNext: (update: boolean) => void }) {
  // Monitor all scanned dice so that they are automatically connected
  const scanStatus = usePixelScannerStatus();
  const { availablePixels, startScan, stopScan, scanError } = usePixelScanner();

  // Connect to all dice
  const central = usePixelsCentral();
  const [centralReady, setCentralReady] = React.useState(central.isReady);
  React.useEffect(() => {
    const listener = () => setCentralReady(central.isReady);
    listener();
    return central.addListener("isReady", listener);
  }, [central]);
  React.useEffect(() => {
    if (centralReady) {
      // Note: list of watched Pixels not cleared on fast refresh
      for (const scannedPixel of availablePixels) {
        central.register(scannedPixel.pixelId);
        central.tryConnect(scannedPixel.pixelId);
      }
    } else {
      // And unregister all if Bluetooth becomes unavailable
      central.unregisterAll();
    }
  }, [availablePixels, central, centralReady]);

  // List of monitored pixels
  const pixels = useRegisteredPixels();
  const diceCount = pixels.length;

  // On leaving page
  const dfuFilesStatus = useAppSelector(
    (state) => state.appTransient.dfuFilesStatus
  );
  const leavePage = (action: "pair" | "skip") => {
    stopScan();
    if (action === "skip") {
      central.unregisterAll();
      onNext(false); // Skip updating dice
    } else {
      const needUpdate = central.registeredPixelsIds
        .map(ScannedDevicesRegistry.findPixel)
        .some(
          (p) =>
            typeof dfuFilesStatus === "object" &&
            getDieDfuAvailability(
              p!.firmwareDate.getTime(),
              dfuFilesStatus.timestamp
            ) !== "up-to-date"
        );
      onNext(needUpdate);
    }
  };

  // Stop on leaving page (that's for fast reload
  // as the normal user workflow will always stop scanning)
  React.useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  const [showHelp, setShowHelp] = React.useState(false);
  const [showTurnOn, setShowTurnOn] = React.useState(false);
  React.useEffect(() => {
    if (scanStatus === "scanning") {
      const id = setTimeout(() => setShowHelp(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowHelp(false);
    }
  }, [scanStatus]);

  const { colors } = useTheme();
  return (
    <Slide title="Pair Your Dice">
      <ScrollView alwaysBounceVertical={false} style={{ marginVertical: 10 }}>
        <Image
          contentFit="cover"
          style={{
            width: "100%",
            height: 60,
            marginVertical: 40,
          }}
          source={require("#/temp/dice-row.jpg")}
        />
        {scanStatus !== "scanning" ? (
          <Animated.View
            key="stopped"
            exiting={FadeOut.duration(300)}
            style={{
              flexGrow: 1,
              flexShrink: 1,
              marginVertical: 10,
              gap: 40,
            }}
          >
            <Text>
              To customize your Pixels Dice the app needs to establish a
              Bluetooth connection.
            </Text>
            <Animated.View
              key={scanError ? "error" : "ok"}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={{ alignItems: "center", gap: 40 }}
            >
              {!scanError ? (
                <>
                  <View style={{ height: 40 }}>
                    <MaterialCommunityIcons
                      name="bluetooth"
                      size={40}
                      color={colors.onSurface}
                    />
                  </View>
                  {scanStatus === "stopped" && (
                    <Text>
                      {"Please ensure you have Bluetooth turned on and grant permissions " +
                        "through your device settings. Tap the Continue button to allow " +
                        "the app to request access."}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  {/* Encapsulate icon in a fixed size view so the layout doesn't change when
                icon gets loaded... don't know why this is happening though */}
                  <View style={{ height: 40 }}>
                    <MaterialIcons
                      name={
                        scanError instanceof BluetoothNotAuthorizedError
                          ? "block"
                          : "bluetooth-disabled"
                      }
                      size={40}
                      color={colors.error}
                    />
                  </View>
                  <Text>
                    {getBluetoothScanErrorMessage(scanError, {
                      withContinue: true,
                    })}
                  </Text>
                </>
              )}
            </Animated.View>
            {scanStatus === "stopped" && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
                <GradientButton
                  style={{
                    marginTop: 20,
                    alignItems: "flex-start",
                    alignSelf: "center",
                  }}
                  onPress={() => startScan()}
                >
                  Continue
                </GradientButton>
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            key="scanning"
            entering={FadeIn.duration(300).delay(200)}
            style={{ flexGrow: 1, flexShrink: 1, marginVertical: 10, gap: 10 }}
          >
            <ScannedPixelsCount diceCount={diceCount} />
            <View
              style={{
                paddingHorizontal: 10,
                paddingTop: diceCount ? 20 : 0,
                paddingBottom: diceCount ? 10 : 0,
                gap: 20,
              }}
            >
              {pixels.map((p) => (
                <PixelItem
                  key={p.pixelId}
                  scannedPixel={ScannedDevicesRegistry.findPixel(p.pixelId)!}
                  pixel={p}
                />
              ))}
            </View>
            {showHelp && (
              <Animated.View
                layout={CurvedTransition.easingY(Easing.linear).duration(300)}
                entering={FadeIn.duration(300)}
              >
                {diceCount ? (
                  <SmallText>Not seeing all your dice?</SmallText>
                ) : (
                  <AnimatedText
                    variant="bodyLarge"
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    style={{ marginBottom: 10 }}
                  >
                    {getNoAvailableDiceMessage()}
                  </AnimatedText>
                )}
                <TightTextButton
                  underline
                  sentry-label="show-help"
                  style={{
                    marginLeft: -8,
                    alignSelf: "flex-start",
                  }}
                  onPress={() => setShowTurnOn(true)}
                >
                  Tap to get help turning on your dice.
                </TightTextButton>
                <SmallText style={{ marginTop: 20 }}>
                  You can also pair your dice later in the app.
                </SmallText>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>
      <SkipButton
        sentry-label="skip-pairing"
        onPress={() => leavePage("skip")}
      />
      {diceCount > 0 && (
        <AnimatedGradientButton
          entering={FadeIn.duration(300).delay(200)}
          onPress={() => leavePage("pair")}
        >
          {diceCount === 1 ? "Pair My Die" : `Pair These ${diceCount} Dice`}
        </AnimatedGradientButton>
      )}
      <HelpTurnOnDiceModal
        visible={showTurnOn}
        onDismiss={() => setShowTurnOn(false)}
      />
    </Slide>
  );
}

function UpdateDiceSlide({ onNext }: { onNext: () => void }) {
  // List of monitored pixels
  const pixels = useRegisteredPixels();
  const diceStr = pixels.length <= 1 ? "die" : "dice";

  // DFU
  const updateDice = useUpdateDice();
  const [step, setStep] = React.useState<"wait" | "update" | "done">("wait");
  return (
    <Slide title="Update Dice Firmware">
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingVertical: 10, gap: 20 }}
      >
        <LightUpYourGameImage marginVertical={40} />
        {step === "wait" ? (
          <Animated.View
            key="wait"
            exiting={FadeOut.duration(300)}
            style={{
              flexGrow: 1,
              flexShrink: 1,
              alignItems: "center",
              gap: 40,
            }}
          >
            <Text>{getFirmwareUpdateAvailable(pixels.length)}</Text>
            <Text>{getKeepAllDiceUpToDate()}</Text>
            <Text>{getKeepDiceNearDevice(pixels.length)}</Text>
            <DfuFilesGate>
              {({ dfuFilesInfo }) => (
                <GradientButton
                  style={{ alignItems: "flex-start", alignSelf: "center" }}
                  onPress={() => {
                    setStep("update");
                    updateDice(
                      pixels.map((d) => d.pixelId),
                      dfuFilesInfo
                    ).finally(() => setStep("done")); // No error should be thrown
                  }}
                >
                  Update
                </GradientButton>
              )}
            </DfuFilesGate>
          </Animated.View>
        ) : (
          <Animated.View
            key="update"
            entering={FadeIn.duration(300).delay(200)}
            style={{ flexGrow: 1, flexShrink: 1, gap: 20 }}
          >
            <Text>
              {step === "update"
                ? `Updating your ${diceStr}...`
                : `Your ${
                    pixels.length <= 1 ? "die is" : "dice are"
                  } up-to-date.`}
            </Text>
            <PixelDfuList pairedDice={pixels} />
          </Animated.View>
        )}
      </ScrollView>
      {step === "done" && (
        <AnimatedGradientButton
          entering={FadeIn.duration(300)}
          onPress={onNext}
        >
          Next
        </AnimatedGradientButton>
      )}
      {step === "wait" && (
        <SkipButton sentry-label="skip-update-dice" onPress={onNext} />
      )}
    </Slide>
  );
}

function ReadySlide({ onDone }: { onDone: () => void }) {
  const pixelsCount = useAppSelector((state) => state.pairedDice.paired.length);
  const diceStr = pixelsCount <= 1 ? "die" : "dice";
  const { fonts } = useTheme();
  return (
    <Slide title="You are all set!">
      <View style={{ flexGrow: 1, justifyContent: "space-evenly" }}>
        <LightUpYourGameImage style={{ height: "30%" }} />
        <Text
          style={{
            lineHeight: fonts.headlineMedium.lineHeight,
            textAlign: "center",
          }}
        >
          Your Pixels {diceStr} light{pixelsCount <= 1 ? "s" : ""} up
          accordingly to the settings of {pixelsCount <= 1 ? "its" : "their"}{" "}
          Profile.
          {"\n"}
          With the app you may customize your {diceStr} Profile or create new
          ones.
        </Text>
      </View>
      <GradientButton sentry-label="onboarding-done" onPress={onDone}>
        Go
      </GradientButton>
    </Slide>
  );
}

// Note: this screen should be unmounted when leaving it
function OnboardingPage({
  navigation,
}: {
  navigation: OnboardingScreenProps["navigation"];
}) {
  const store = useAppStore();
  const central = usePixelsCentral();

  // Page scrolling
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  // Scroll back to first slide when showing this screen
  // (ony used in DEV when doing a fast refresh as this screen
  // is otherwise unmounted when leaving it)
  useFocusEffect(
    React.useCallback(
      () => scrollRef.current?.scrollTo({ x: 0, animated: false }),
      []
    )
  );

  const storeDiceAndScrollTo = (page: number) => {
    const pixels = central.pixels;
    // Add all paired dice to the store
    for (const p of pixels) {
      pairDie(p, store);
    }
    // Don't show onboarding again
    store.dispatch(setShowOnboarding(false));
    // Scroll to page
    scrollTo(page);
  };

  const connectAndScrollTo = (page: number) => {
    // Reconnect all dice
    for (const id of central.registeredPixelsIds) {
      central.tryConnect(id);
    }
    // Scroll to page
    scrollTo(page);
  };

  return (
    <>
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
        {/* <SettingsSlide onNext={() => scrollTo(3)} /> */}
        <ScanSlide onNext={(update) => storeDiceAndScrollTo(update ? 3 : 4)} />
        <UpdateDiceSlide onNext={() => connectAndScrollTo(4)} />
        <ReadySlide onDone={() => navigation.navigate("home")} />
      </ScrollView>
      {/* Bottom page indicator */}
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
        <PaperText>{index + 1} / 5</PaperText>
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
    </>
  );
}

export function OnboardingScreen({ route, navigation }: OnboardingScreenProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <AppBackground topLevel>
        <OnboardingPage navigation={navigation} />
      </AppBackground>
    </NavigationRoot>
  );
}

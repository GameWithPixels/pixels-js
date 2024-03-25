import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  BluetoothNotAuthorizedError,
  Pixel,
  PixelDieType,
  PixelInfo,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps } from "expo-image";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
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
  IconButton,
  Switch,
  SwitchProps,
  Text as PaperText,
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

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import {
  getBluetoothScanErrorMessage,
  getNoAvailableDiceMessage,
} from "~/app/messages";
import { AppBackground } from "~/components/AppBackground";
import { NavigationRoot } from "~/components/NavigationRoot";
import { ScannedPixelsCount } from "~/components/ScannedPixelsCount";
import { TurnOnDiceHelp } from "~/components/TunOnDiceHelp";
import { useFlashAnimationStyleOnRoll } from "~/components/ViewFlashOnRoll";
import { AnimatedText } from "~/components/animated";
import {
  AnimatedGradientButton,
  GradientButton,
  TightTextButton,
} from "~/components/buttons";
import { makeTransparent } from "~/components/colors";
import { DieWireframe } from "~/components/icons";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { getDieTypeAndColorwayLabel } from "~/features/profiles";
import { setShowOnboarding } from "~/features/store/appSettingsSlice";
import { addPairedDie } from "~/features/store/pairedDiceSlice";
import { notEmpty } from "~/features/utils";
import { bottomSheetAnimationConfigFix } from "~/fixes";
import {
  useDfuFiles,
  useDfuNotifier,
  useWatchedPixels,
  usePixelScanner,
  usePixelScannerStatus,
  usePixelsCentral,
  usePixelsCentralOnReady,
} from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { useRollStateLabel } from "~/hooks/useRollStateLabel";
import { OnboardingScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

function diceStr(count: number): string {
  return count <= 1 ? "die" : "dice";
}

// TODO use Central!
function isFirmwareUpToDate(
  pixel?: Pick<PixelInfo, "firmwareDate">,
  dfuBundle?: { readonly timestamp: number }
) {
  return (
    dfuBundle && pixel && pixel.firmwareDate.getTime() >= dfuBundle.timestamp
  );
}

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
  const { colors } = useTheme();
  return (
    <Button
      textColor={makeTransparent(colors.onBackground, 0.5)}
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
      animationConfigs={bottomSheetAnimationConfigFix}
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
          <LightUpYourGameImage />
          <TurnOnDiceHelp />
          <LightUpYourGameImage />
        </BottomSheetScrollView>
        <IconButton
          icon="close"
          iconColor={colors.primary}
          sentry-label="close-turn-on-dice-help"
          style={{ position: "absolute", right: 0, top: -15 }}
          onPress={onDismiss}
        />
      </ThemeProvider>
    </BottomSheetModal>
  );
}

function PixelItem({ pixel }: { pixel: Pixel }) {
  const [name] = usePixelValue(pixel, "name");
  const rollLabel = useRollStateLabel(pixel);
  const animStyle = useFlashAnimationStyleOnRoll();
  return (
    <AnimatedDieWireframeCard
      entering={FadeIn.duration(300)}
      dieType={pixel.dieType}
      style={animStyle}
    >
      <View style={{ flex: 1, justifyContent: "space-around" }}>
        <Text>{name}</Text>
        <SmallText>{getDieTypeAndColorwayLabel(pixel)}</SmallText>
        <SmallText>{rollLabel}</SmallText>
      </View>
    </AnimatedDieWireframeCard>
  );
}

function ScanSlide({ onNext }: { onNext: (skipUpdate: boolean) => void }) {
  const appDispatch = useAppDispatch();
  const dfuNotifier = useDfuNotifier();

  // Monitor all scanned dice so that they are automatically connected
  const scanStatus = usePixelScannerStatus();
  const { availablePixels, startScan, stopScan, scanError } = usePixelScanner();

  // Connect to all dice
  const central = usePixelsCentral();
  React.useEffect(
    () => availablePixels.forEach((p) => central.watch(p.pixelId)),
    [availablePixels, central]
  );
  // And unwatch all if Bluetooth becomes unavailable
  usePixelsCentralOnReady(
    React.useCallback((ready) => !ready && central.unwatchAll(), [central])
  );

  // List of monitored pixels
  const pixels = useWatchedPixels();
  const diceCount = pixels.length;

  // On leaving page
  const leavePage = (action: "pair" | "skip") => {
    stopScan();
    if (action === "skip") {
      central.unwatchAll();
      onNext(true); // Skip updating dice
    } else {
      for (const p of pixels) {
        appDispatch(
          addPairedDie({
            systemId: p.systemId,
            pixelId: p.pixelId,
            name: p.name,
            dieType: p.dieType,
            colorway: p.colorway,
          })
        );
      }
      onNext(dfuNotifier.outdatedPixels.length > 0); // Update dice if needed
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
        <Animated.ScrollView
          key="stopped"
          exiting={FadeOut.duration(300)}
          style={{
            flexGrow: 1,
            flexShrink: 1,
            marginVertical: 10,
          }}
          contentContainerStyle={{ alignItems: "center", gap: 40 }}
        >
          <Text>
            To customize your Pixels Dice the app needs to establish a Bluetooth
            connection.
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
                {/* Encapsulate icon in a fixed size view so the layout doesn't change when the icon is loaded */}
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
        </Animated.ScrollView>
      ) : (
        <Animated.View
          key="scanning"
          entering={FadeIn.duration(300).delay(200)}
          style={{ flexGrow: 1, flexShrink: 1, marginVertical: 10, gap: 10 }}
        >
          <ScannedPixelsCount diceCount={diceCount} />
          <ScrollView contentContainerStyle={{ paddingBottom: 10, gap: 20 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingTop: diceCount ? 20 : 0,
                paddingBottom: diceCount ? 10 : 0,
                gap: 20,
              }}
            >
              {pixels.map((p) => (
                <PixelItem key={p.pixelId} pixel={p} />
              ))}
            </View>
            {showHelp && (
              <Animated.View
                entering={FadeIn.duration(300)}
                layout={CurvedTransition.easingY(Easing.linear).duration(300)}
              >
                {diceCount ? (
                  <SmallText>Not all dice are listed above?</SmallText>
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
          </ScrollView>
        </Animated.View>
      )}
      {!diceCount ? (
        <SkipButton
          sentry-label="skip-pairing"
          onPress={() => leavePage("skip")}
        />
      ) : (
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

interface TargetDfuStatus
  extends Pick<PixelInfo, "systemId" | "name" | "firmwareDate"> {
  state: DfuState | "pending";
  progress: number;
}

const AnimatedPixelDfuCard = observer(function AnimatedPixelDfuCard({
  scannedPixel,
  dfuStatus,
  ...props
}: AnimatedProps<Omit<ViewProps, "children">> & {
  scannedPixel: PixelInfo;
  dfuStatus?: TargetDfuStatus;
}) {
  const state = dfuStatus?.state;
  return (
    <AnimatedDieWireframeCard dieType={scannedPixel.dieType} {...props}>
      <View style={{ flex: 1, justifyContent: "space-around" }}>
        <Text style={{ textAlign: "auto" }}>{scannedPixel.name}</Text>
        <SmallText>
          Status:{" "}
          {!state || state === "completed"
            ? "up-to-date"
            : state === "aborted" || state === "errored"
              ? "update failed"
              : state === "pending"
                ? "update pending"
                : `${state}, ${dfuStatus.progress}%`}
        </SmallText>
      </View>
    </AnimatedDieWireframeCard>
  );
});

const StatusText = observer(function StatusText({
  statuses,
}: {
  statuses: TargetDfuStatus[];
}) {
  const toUpdateCount = getToUpdateCount(statuses);
  const erroredCount = statuses.filter(
    (s) => s.state === "aborted" || s.state === "errored"
  ).length;
  return (
    <Text>
      {toUpdateCount
        ? `Remaining dice to update: ${toUpdateCount}`
        : erroredCount
          ? ""
          : (statuses.length <= 1 ? "Your die is" : "All your dice are") +
            " up-to-date."}
      {erroredCount > 0 &&
        ` ${erroredCount} ${diceStr(erroredCount)} failed to update.`}
    </Text>
  );
});

function UpdateDiceSlide({ onNext }: { onNext: () => void }) {
  const central = usePixelsCentral();

  // List of monitored pixels
  const pixels = useWatchedPixels();

  // DFU files
  const { dfuFilesInfo, dfuFilesError } = useDfuFiles();
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
  const [step, setStep] = React.useState<"wait" | "update" | "done">("wait");
  const statusesRef = React.useRef<TargetDfuStatus[]>([]);

  // Initialize DFU status
  React.useEffect(() => {
    for (const p of pixels) {
      const index = statusesRef.current.findIndex(
        (s) => s.systemId === p.systemId
      );
      if (index < 0 && !isFirmwareUpToDate(p, dfuFilesInfo)) {
        statusesRef.current.push(
          makeAutoObservable({
            systemId: p.systemId,
            name: p.name,
            firmwareDate: p.firmwareDate,
            state: "pending",
            progress: 0,
          })
        );
      }
    }
  }, [dfuFilesInfo, pixels]);

  return (
    <Slide title="Update Dice Firmware">
      <LightUpYourGameImage marginVertical={40} />
      {step === "wait" ? (
        <Animated.View
          key="wait"
          exiting={FadeOut.duration(300)}
          style={{ flexGrow: 1, flexShrink: 1, alignItems: "center", gap: 40 }}
        >
          <Text>We have a firmware update for your dice!</Text>
          <Text>
            We recommend to keep all dice up-to-date to ensure that they stay
            compatible with the app.
          </Text>
          <Text>
            Keep the Pixels app opened and your dice near your device during the
            update process. They may stay in open chargers but avoid moving
            charger lids or other magnets as it may turn the dice off.
          </Text>
          {dfuFilesInfo ? (
            <GradientButton
              style={{ alignItems: "flex-start", alignSelf: "center" }}
              onPress={() => {
                setStep("update");
                const pixels = statusesRef.current
                  .map((s) => central.getPixel(s.systemId))
                  .filter(notEmpty);
                const task = async () => {
                  for (const pixel of pixels) {
                    central.updatePixelAsync({
                      pixel,
                      bootloaderPath: updateBootloader
                        ? dfuFilesInfo.bootloaderPath
                        : undefined,
                      firmwarePath: dfuFilesInfo.firmwarePath,
                    });
                    setStep("done");
                  }
                };
                task();
              }}
            >
              Update
            </GradientButton>
          ) : (
            <Text>Loading files...</Text>
          )}
        </Animated.View>
      ) : (
        <Animated.View
          key="update"
          entering={FadeIn.duration(300).delay(200)}
          style={{ flexGrow: 1, flexShrink: 1, gap: 20 }}
        >
          <StatusText statuses={statusesRef.current} />
          <ScrollView contentContainerStyle={{ paddingVertical: 10, gap: 20 }}>
            {pixels.map((p, i) => (
              <AnimatedPixelDfuCard
                key={p.pixelId}
                entering={FadeIn.duration(300).delay(200 + i * 100)}
                scannedPixel={p}
                dfuStatus={statusesRef.current.find(
                  (s) => s.systemId === p.systemId
                )}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
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
  const dice = diceStr(pixelsCount);
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
          Your Pixels {dice} light{pixelsCount <= 1 ? "s" : ""} up accordingly
          to the settings of {pixelsCount <= 1 ? "its" : "their"} Profile.
          {"\n"}
          With the app you may customize your {dice} Profile or create new ones.
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
  const appDispatch = useAppDispatch();

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

  const leave = () => {
    appDispatch(setShowOnboarding(false));
    navigation.navigate("home");
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
        <ScanSlide onNext={(skipUpdate) => scrollTo(skipUpdate ? 4 : 3)} />
        <UpdateDiceSlide onNext={() => scrollTo(4)} />
        <ReadySlide onDone={leave} />
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
      <AppBackground>
        <OnboardingPage navigation={navigation} />
      </AppBackground>
    </NavigationRoot>
  );
}

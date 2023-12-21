import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  BluetoothPermissionsDeniedError,
  BluetoothTurnedOffError,
  getPixel,
  Pixel,
  PixelDieType,
  PixelInfo,
  PixelScannerStatus,
  ScannedPixel,
  useScannedPixelNotifiers,
} from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps } from "expo-image";
import { makeAutoObservable, runInAction } from "mobx";
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
  ActivityIndicator,
  Button,
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

import { useAppDispatch } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { DieStaticInfo } from "~/components/ScannedDieStatus";
import {
  AnimatedGradientButton,
  GradientButton,
  TightTextButton,
} from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { makeTransparent } from "~/components/utils";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { getNativeErrorMessage } from "~/features/getNativeErrorMessage";
import { setShowOnboarding } from "~/features/store/appSettingsSlice";
import { usePairedPixels } from "~/hooks";
import { OnboardingScreenProps } from "~/navigation";
import { getBottomSheetBackgroundStyle, getRootScreenTheme } from "~/themes";

function diceStr(count: number): string {
  return count <= 1 ? "die" : "dice";
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

function SkipButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Button
      textColor={makeTransparent(colors.onBackground, 0.5)}
      style={{ position: "absolute", top: -70, right: -20 }} // TODO better positioning
      onPress={onPress}
    >
      Skip
    </Button>
  );
}

function Title({ children }: React.PropsWithChildren) {
  return (
    <PaperText
      variant="titleLarge"
      style={{ alignSelf: "center" }}
      children={children}
    />
  );
}

function SubTitle(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleMedium" {...props} />;
}

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
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
        <Text children={children} />
      ) : (
        <View style={{ flex: 1 }} children={children} />
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
      <ScrollView
        style={{ marginTop: 20 }}
        contentContainerStyle={{ gap: 30, paddingVertical: 10 }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
          <Text>⚠️</Text>
          <View style={{ flex: 1, gap: 20 }}>
            <SubTitle style={{ textTransform: "uppercase" }}>
              Photosensitive / Epilepsy Warning
            </SubTitle>
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
            STOP using Pixels Dice and app immediately if you experience and of
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
          <LightUpYourGameImage />
          <Text style={{ color: colors.onBackground }}>
            Text and images explaining how to turn on dice.
          </Text>
          {range(20).map((i) => (
            <Text key={i} style={{ color: colors.onBackground }}>
              Adding a lot of text to enable content scrolling.
            </Text>
          ))}
          <LightUpYourGameImage />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

function ScanSlide({
  pixels,
  scannerStatus,
  onStartScan,
  onNext,
}: {
  pixels: readonly Pixel[];
  scannerStatus: PixelScannerStatus;
  onStartScan: () => void;
  onNext: () => void;
}) {
  const [showHelpButton, setScanFirstTimeout] = React.useState(false);
  const [showTurnOn, setShowTurnOn] = React.useState(false);
  React.useEffect(() => {
    if (scannerStatus === "scanning") {
      const id = setTimeout(() => setScanFirstTimeout(true), 3000);
      return () => clearTimeout(id);
    } else {
      setScanFirstTimeout(false);
    }
  }, [scannerStatus]);
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
      {scannerStatus !== "scanning" ? (
        <Animated.View
          key="stopped"
          exiting={FadeOut.duration(300)}
          style={{ flexGrow: 1, flexShrink: 1, marginVertical: 10, gap: 40 }}
        >
          <Text>
            In order to let you customize your dice the app needs to connect to
            your dice using Bluetooth.
          </Text>
          <Text>
            {scannerStatus === "stopped"
              ? "Please make sure that you have Bluetooth turned on " +
                "and give permission for the app to access Bluetooth " +
                "when prompted after pressing the button bellow."
              : scannerStatus instanceof BluetoothPermissionsDeniedError
                ? "❌ The app was not given permission to use Bluetooth, " +
                  "please tap on the button below again and give permission " +
                  "for the app to access Bluetooth so it can connect to your dice."
                : scannerStatus instanceof BluetoothTurnedOffError
                  ? "❌ Bluetooth seems to be turned off, please first enable " +
                    "Bluetooth in your system settings and then give permission " +
                    "for the app to access Bluetooth after pressing the button " +
                    "bellow again."
                  : `❌ Got an unexpected error: ${getNativeErrorMessage(
                      scannerStatus
                    )}`}
          </Text>
          <GradientButton
            style={{
              marginTop: 20,
              alignItems: "flex-start",
              alignSelf: "center",
            }}
            onPress={onStartScan}
          >
            Use Bluetooth
          </GradientButton>
        </Animated.View>
      ) : (
        <Animated.View
          key="scanning"
          entering={FadeIn.duration(300).delay(200)}
          style={{ flexGrow: 1, flexShrink: 1, marginVertical: 10, gap: 10 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Text>Looking for Pixels...</Text>
            <ActivityIndicator />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 10, gap: 20 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingTop: pixels.length ? 20 : 0,
                paddingBottom: pixels.length ? 10 : 0,
                gap: 20,
              }}
            >
              {pixels.map((p) => (
                <AnimatedDieWireframeCard
                  key={p.pixelId}
                  entering={FadeIn.duration(300)}
                  dieType={p.dieType}
                >
                  <DieStaticInfo pixel={p} />
                </AnimatedDieWireframeCard>
              ))}
            </View>
            {showHelpButton && (
              <Animated.View
                entering={FadeIn.duration(300)}
                layout={CurvedTransition.easingY(Easing.linear).duration(300)}
              >
                {pixels.length ? (
                  <SmallText>Don't see all your dice?</SmallText>
                ) : (
                  <Text>We don't see any dice so far.</Text>
                )}
                <TightTextButton
                  underline
                  onPress={() => setShowTurnOn(true)}
                  style={{ marginLeft: -10, alignSelf: "flex-start" }}
                >
                  Tap to get help turning on your dice.
                </TightTextButton>
                <SmallText style={{ marginTop: 20 }}>
                  You can also scan for dice later in the app.
                </SmallText>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      )}
      {!pixels.length ? (
        <SkipButton onPress={onNext} />
      ) : (
        <AnimatedGradientButton
          entering={FadeIn.duration(300).delay(200)}
          onPress={onNext}
        >
          {pixels.length === 1
            ? "Pair My Pixels Die"
            : `Pair These ${pixels.length} Pixels Dice`}
        </AnimatedGradientButton>
      )}
      <HelpTurnOnDiceModal
        visible={showTurnOn}
        onDismiss={() => setShowTurnOn(false)}
      />
    </Slide>
  );
}

interface TargetDfuStatus {
  scannedPixel: ScannedPixel;
  state: DfuState | "pending";
  progress: number;
}

async function updateDice(
  statuses: TargetDfuStatus[],
  dfuBundle: DfuFilesBundle
): Promise<void> {
  console.log(`DFU bundle date: ${dfuBundle.date.toLocaleDateString()}`);
  let i = 0;
  while (i < statuses.length) {
    const status = statuses[i++];
    try {
      await updateFirmware({
        target: status.scannedPixel,
        // bootloaderPath: dfuBundle.bootloader?.pathname,
        firmwarePath: dfuBundle.firmware?.pathname,
        dfuStateCallback: (state: DfuState) =>
          runInAction(() => (status.state = state)),
        dfuProgressCallback: (progress: number) =>
          runInAction(() => (status.progress = progress)),
      });
    } catch (e) {
      console.log(`DFU error with ${status.scannedPixel.name}: ${e}`);
    }
  }
}

function appendNewDiceStatuses(
  statuses: TargetDfuStatus[],
  scannedPixels: readonly ScannedPixel[],
  dfuBundle?: DfuFilesBundle
) {
  for (const sp of scannedPixels) {
    const i = statuses.findIndex((s) => s.scannedPixel === sp);
    if (i < 0 && !isPixelUpToDate(sp, dfuBundle)) {
      statuses.push(
        makeAutoObservable({
          scannedPixel: sp,
          state: "pending",
          progress: 0,
        })
      );
    }
  }
}

function getToUpdateCount(statuses: TargetDfuStatus[]): number {
  return statuses.filter(
    (s) =>
      s.state !== "completed" && s.state !== "aborted" && s.state !== "errored"
  ).length;
}

const AnimatedPixelDfuCard = observer(function AnimatedPixelDfuCard({
  scannedPixel,
  dfuStatus,
  ...props
}: AnimatedProps<Omit<ViewProps, "children">> & {
  scannedPixel: ScannedPixel;
  dfuStatus?: TargetDfuStatus;
}) {
  const state = dfuStatus?.state;
  return (
    <AnimatedDieWireframeCard dieType={scannedPixel.dieType} {...props}>
      <View style={{ flex: 1, justifyContent: "space-around" }}>
        <Text>{scannedPixel.name}</Text>
        <SmallText>
          {!state || state === "completed"
            ? "Up To Date"
            : state === "aborted" || state === "errored"
              ? "Update Failed"
              : state === "pending"
                ? "Update Required"
                : `State ${state}, ${dfuStatus.progress}%`}
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
        ? `${toUpdateCount} ${diceStr(toUpdateCount)} left to update.`
        : erroredCount
          ? ""
          : (statuses.length <= 1 ? "Your die is" : "All your dice are") +
            " up-to-date."}
      {erroredCount > 0 &&
        ` ${erroredCount} ${diceStr(erroredCount)} failed to update.`}
    </Text>
  );
});

function UpdateDiceSlide({
  scannedPixels,
  dfuBundle,
  onNext,
}: {
  scannedPixels: readonly ScannedPixel[];
  dfuBundle?: DfuFilesBundle;
  onNext: () => void;
}) {
  const [step, setStep] = React.useState<"wait" | "update" | "done">("wait");
  const statusesRef = React.useRef<TargetDfuStatus[]>([]);
  React.useEffect(
    () =>
      // Note: this only works properly if the DFU bundle stays the same
      // and Pixels are not removed (which is true for our use case)
      appendNewDiceStatuses(statusesRef.current, scannedPixels, dfuBundle),
    [dfuBundle, scannedPixels]
  );
  return (
    <Slide title="Update Dice Software">
      <LightUpYourGameImage marginVertical={40} />
      {step === "wait" ? (
        <Animated.View
          key="wait"
          exiting={FadeOut.duration(300)}
          style={{ flexGrow: 1, flexShrink: 1, gap: 40 }}
        >
          <Text>We have a software update for your dice!</Text>
          <Text>
            We recommend to update them so they work properly with the app. It
            usually takes less than 20 seconds per die.
          </Text>
          <Text>
            Please ensure that the dice stay on and close to your phone during
            the update process. You may place your dice inside the charging case
            but do not close the lid as it will turn off the die.
          </Text>
          {dfuBundle ? (
            <GradientButton
              style={{ alignItems: "flex-start", alignSelf: "center" }}
              onPress={() => {
                setStep("update");
                updateDice(statusesRef.current, dfuBundle).then(() =>
                  setStep("done")
                );
              }}
            >
              Update{" "}
              {getToUpdateCount(statusesRef.current) <= 1
                ? "My Die"
                : "My Dice"}
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
            {scannedPixels.map((sp, i) => (
              <AnimatedPixelDfuCard
                key={sp.pixelId}
                entering={FadeIn.duration(300).delay(200 + i * 100)}
                scannedPixel={sp}
                dfuStatus={statusesRef.current.find(
                  (s) => s.scannedPixel === sp
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
      {step === "wait" && <SkipButton onPress={onNext} />}
    </Slide>
  );
}

function ReadySlide({ onDone }: { onDone: () => void }) {
  return (
    <Slide>
      <View style={{ flexGrow: 1 }}>
        <View style={{ flexGrow: 1, justifyContent: "center", gap: 30 }}>
          <Title>Customize Your Dice</Title>
          <Text>
            The Pixels app automatically connects to your dice and let you
            customize how they light up.
          </Text>
          <Text>
            You can make them speak text on your phone and or make web requests.
          </Text>
        </View>
        <LightUpYourGameImage />
        <View style={{ flexGrow: 1, justifyContent: "center", gap: 30 }}>
          <Title>Customize Your App</Title>
          <Text>
            You can configure how the app display your dice and profile lists to
            your liking. Explore the different view options!
          </Text>
        </View>
      </View>
      <GradientButton onPress={onDone}>Go</GradientButton>
    </Slide>
  );
}

function connectPixel(sp: ScannedPixel): Pixel | undefined {
  const pixel = getPixel(sp.pixelId);
  pixel?.connect().catch((e: Error) => console.log(`Connection error: ${e}`));
  return pixel;
}

function isPixelUpToDate(pixel: PixelInfo, dfuBundle?: DfuFilesBundle) {
  // return !dfuBundle || pixel.firmwareDate >= dfuBundle.date;
  return !dfuBundle;
}

function OnboardingPage({
  navigation,
}: {
  navigation: OnboardingScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

  const [scannedPixels, scannerDispatch, scannerStatus] =
    useScannedPixelNotifiers({
      autoStart: false,
    });
  const pixels = React.useMemo(
    () => scannedPixels.map(connectPixel).filter((p): p is Pixel => !!p),
    [scannedPixels]
  );
  const { pairDie } = usePairedPixels();

  // Stop scanning on leaving scan page
  React.useEffect(() => {
    return () => {
      scannerDispatch("stop");
      scannerDispatch("clear");
    };
  }, [scannerDispatch]);

  const [dfuBundle, setDfuBundle] = React.useState<DfuFilesBundle>();
  React.useEffect(() => {
    const task = async () => {
      // Unzip app DFU files
      const files = await unzipEmbeddedDfuFilesAsync();
      // Group them in DFU bundles
      const bundles = await DfuFilesBundle.createMany(
        files.map((p) => getDfuFileInfo(p))
      );
      // Use most recent bundle
      setDfuBundle(bundles.reduce((a, b) => (a.date >= b.date ? a : b)));
    };
    task().catch((e) => console.log(`Error: ${e}`));
  }, []);

  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollTo = (page: number) =>
    scrollRef.current?.scrollTo({ x: page * width });

  // Scroll back to first slide when showing this screen
  useFocusEffect(
    React.useCallback(
      () => scrollRef.current?.scrollTo({ x: 0, animated: false }),
      []
    )
  );

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
        <ScanSlide
          pixels={pixels}
          scannerStatus={scannerStatus}
          onStartScan={() => {
            scannerDispatch("clear");
            scannerDispatch("start");
          }}
          onNext={() => {
            scannerDispatch("stop");
            for (const p of pixels) {
              pairDie(p);
            }
            scrollTo(
              pixels.some((p) => !isPixelUpToDate(p, dfuBundle)) ? 3 : 4
            );
          }}
        />
        <UpdateDiceSlide
          scannedPixels={scannedPixels}
          dfuBundle={dfuBundle}
          onNext={() => scrollTo(4)}
        />
        <ReadySlide
          onDone={() => {
            appDispatch(setShowOnboarding(false));
            navigation.navigate("home");
          }}
        />
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
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <AppBackground>
        <OnboardingPage navigation={navigation} />
      </AppBackground>
    </ThemeProvider>
  );
}

import {
  assertNever,
  safeAssign,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  PixelEventMap,
  PlayProfileAnimation,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { AVPlaybackSource } from "expo-av";
import { Image } from "expo-image";
import * as Speech from "expo-speech";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

// https://freesound.org/people/Benboncan/sounds/73581/
import sadTromboneSound from "#/demo/benboncan_sad-trombone.wav";
// https://freesound.org/people/Fupicat/sounds/527650/
import winSquareSound from "#/demo/fupicat_winsquare.wav";
// https://freesound.org/people/Vesperia94/sounds/403057/
import hooraySound from "#/demo/vesperia94_hooray.wav";
import { PairedMPC } from "~/app/PairedMPC";
import { useAppSelector, useAppStore } from "~/app/hooks";
import { RollToWinScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { playSoundAsync } from "~/features/audio";
import { playAnimOnMPCs, stopAnimOnMPCs } from "~/features/mpcUtils";
import {
  incrementRollToWinCounter,
  incrementRollToWinSuccesses,
  readProfile,
} from "~/features/store";
import { usePixelsCentral } from "~/hooks";

const rainbowColors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet",
  "red",
] as const;

const ResultConfig = {
  reset: {
    mpcAnim: { index: 2, duration: 1000 },
  },
  rolling: {
    mpcAnim: { index: 4 },
  },
  99: {
    mpcAnim: { index: 0 },
    dieAnim: { name: "Rolling Rainbow", delay: 2000, loopCount: 2 },
    sound: { source: hooraySound },
  },
  60: {
    mpcAnim: { index: 3 },
    dieAnim: { name: "Colored Flash", delay: 2000, loopCount: 2 },
    sound: { source: winSquareSound },
  },
  25: {
    mpcAnim: { index: 5 },
    dieAnim: { name: "Waterfall Rainbow", delay: 2000, loopCount: 2 },
    sound: { source: winSquareSound },
  },
  0: {
    mpcAnim: { index: 1 },
    dieAnim: { name: "Quick Red", delay: 2000, loopCount: 2 },
    sound: { source: sadTromboneSound, volume: 0.5 },
  },
};

function getActionConfig(result: number | "reset" | "rolling"): {
  mpcAnim?: { index: number; duration?: number };
  dieAnim?: { name: string; delay: number; loopCount?: number };
  sound?: { source: AVPlaybackSource; volume?: number };
} {
  if (result === "reset" || result === "rolling") {
    return ResultConfig[result];
  } else {
    const thresholds = Object.keys(ResultConfig)
      .map(Number)
      .filter((k) => !Number.isNaN(k))
      .sort((a, b) => b - a);
    for (const t of thresholds) {
      if (result >= t) {
        return ResultConfig[t as keyof typeof ResultConfig];
      }
    }
    return ResultConfig[0];
  }
}

type DieInfo = { pixel: Pixel; profile: Profiles.Profile };

function playAnimOnDie(
  { pixel, profile }: DieInfo,
  animName: string,
  loopCount = 1
) {
  const anims = profile.collectAnimations();
  console.log(`Anims: ${anims.map((a) => a.name).join(", ")}`);
  const animationIndex = anims.findIndex((a) => a.name === animName);
  if (animationIndex >= 0) {
    pixel
      .sendMessage(
        safeAssign(new PlayProfileAnimation(), {
          animationIndex,
          loopCount,
          remapToFace: pixel.currentFaceIndex,
        })
      )
      .catch((e) => console.log(`playProfileAnim error ${e}`));
  } else {
    console.log(
      `Animation ${animName} not found for ${pixel.dieType} ${unsigned32ToHex(pixel.pixelId)}`
    );
  }
}

// TODO hack to stop MPCs animations before starting a new one
let stopMPCAnims: (() => void) | undefined = undefined;

function playAction({
  result,
  die10,
  die00,
  pairedMPCs,
}: {
  result: number | "reset" | "rolling";
  die10?: DieInfo;
  die00?: DieInfo;
  pairedMPCs: PairedMPC[];
}) {
  const { mpcAnim, dieAnim, sound } = getActionConfig(result);
  console.log(
    `Playing action ${result}, mpcAnim: ${mpcAnim}, dieAnim: ${dieAnim}, sound: ${!!sound}`
  );
  if (mpcAnim) {
    stopMPCAnims?.();
    playAnimOnMPCs(pairedMPCs, mpcAnim.index);
    const stop = () => {
      stopAnimOnMPCs(pairedMPCs, mpcAnim.index);
      stopMPCAnims = undefined;
    };
    if (mpcAnim.duration) {
      const id = setTimeout(stop, mpcAnim.duration);
      stopMPCAnims = () => {
        clearTimeout(id);
        stop();
      };
    } else {
      stopMPCAnims = stop;
    }
  }
  if (dieAnim) {
    setTimeout(() => {
      die10 && playAnimOnDie(die10, dieAnim.name);
      die00 && playAnimOnDie(die00, dieAnim.name);
    }, dieAnim.delay);
  }
  if (sound) {
    if (typeof result === "number") {
      const settings = { volume: 1, pitch: 1, rate: 1 } as const;
      Speech.speak(result.toString(), settings);
    }
    setTimeout(
      () =>
        playSoundAsync(sound.source, sound.volume).catch((e) =>
          console.log(`playSoundAsync error: ${e}`)
        ),
      2500
    );
  }
}

interface CombinedRollsState {
  d00?: number | "rolling";
  d10?: number | "rolling";
  die00?: DieInfo;
  die10?: DieInfo;
  pairedMPCs: PairedMPC[];
}

function rollReducer(
  state: CombinedRollsState,
  action:
    | ({ type: "registerDie"; onRegistered?: () => void } & DieInfo)
    | { type: "unregisterDie"; pixelId: number }
    | { type: "registerMPCs"; pairedMPCs: PairedMPC[] }
    | { type: "resetRolls" }
    | ({
        type: "rollState";
        dieType: "d10" | "d00";
        onResult?: (result: number) => void;
      } & PixelEventMap["rollState"])
): CombinedRollsState {
  const { type } = action;
  switch (type) {
    case "registerDie": {
      const { pixel, profile } = action;
      if (pixel.dieType === "d10" && !state.die10) {
        console.log(`REGISTER ${pixel.dieType}`);
        action.onRegistered?.();
        return { ...state, die10: { pixel, profile } };
      }
      if (pixel.dieType === "d00" && !state.die00) {
        console.log(`REGISTER ${pixel.dieType}`);
        action.onRegistered?.();
        return { ...state, die00: { pixel, profile } };
      }
      break;
    }
    case "unregisterDie": {
      const { die10, die00 } = state;
      if (die10?.pixel.pixelId === action.pixelId) {
        console.log(`UNREGISTER ${die10.pixel.dieType}`);
        return { ...state, die10: undefined };
      }
      if (die00?.pixel.pixelId === action.pixelId) {
        console.log(`UNREGISTER ${die00.pixel.dieType}`);
        return { ...state, die00: undefined };
      }
      break;
    }
    case "registerMPCs": {
      console.log("REGISTER MPCs");
      const { pairedMPCs } = action;
      return { ...state, pairedMPCs };
    }
    case "resetRolls": {
      console.log("RESET");
      playAction({ result: "reset", ...state });
      return { ...state, d00: undefined, d10: undefined };
    }
    case "rollState": {
      const { die10, die00, pairedMPCs } = state;
      if (
        die10 &&
        die00 &&
        // Ignore roll events once we have a result
        !(typeof state.d00 === "number" && typeof state.d10 === "number")
      ) {
        const { dieType, state: rollState, faceIndex, onResult } = action;
        if (rollState === "handling" || rollState === "rolling") {
          if (state[dieType] !== "rolling") {
            // Play action only if the other die is not already rolling
            if (state[dieType === "d10" ? "d00" : "d10"] !== "rolling") {
              playAction({ result: "rolling", ...state });
            }
            return { ...state, [dieType]: "rolling" };
          }
        } else if (rollState !== "rolled") {
          console.log("STILL");
          stopMPCAnims?.();
          return { ...state, [dieType]: undefined };
        } else {
          console.log("ROLLED");
          const newState = { ...state, [dieType]: faceIndex };
          if (
            typeof newState.d00 === "number" &&
            typeof newState.d10 === "number"
          ) {
            if (newState.d10 + newState.d00 === 0) {
              newState.d00 = 10;
            }
            const result = newState.d10 + 10 * newState.d00;
            playAction({ result, die10, die00, pairedMPCs });
            onResult?.(result);
          }
          return newState;
        }
      }
      break;
    }
    default:
      assertNever(type, `Unknown action type: ${type}`);
  }
  return state;
}

function RollValue({
  value,
  ...props
}: {
  value?: number | "rolling";
} & ViewProps) {
  const { width } = useWindowDimensions();
  const [random, setRandom] = React.useState(0);
  React.useEffect(() => {
    if (value === "rolling") {
      const id = setInterval(
        () => setRandom(Math.floor(10 * Math.random())),
        100
      );
      return () => clearInterval(id);
    }
  }, [value]);
  const v = value === "rolling" ? random : (value ?? "-");
  return (
    <View {...props}>
      <Text style={{ fontSize: width / 2.2 }}>{v}</Text>
    </View>
  );
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

function RollToWinScreenScreenPage({
  navigation: _,
}: {
  navigation: RollToWinScreenProps["navigation"];
}) {
  const central = usePixelsCentral();
  const store = useAppStore();
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);

  const [diceState, dispatch] = React.useReducer(rollReducer, {
    pairedMPCs: [],
  });

  // Auto-reset
  const resetTimeoutIdRef = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => {
    if (
      typeof diceState.d10 === "number" &&
      typeof diceState.d00 === "number"
    ) {
      clearTimeout(resetTimeoutIdRef.current);
      resetTimeoutIdRef.current = setTimeout(
        () => dispatch({ type: "resetRolls" }),
        3000
      );
    }
  }, [diceState.d00, diceState.d10]);

  // Watch D10s & D00s
  React.useEffect(() => {
    const disposers: (() => void)[] = [];
    for (const d of pairedDice) {
      const { dieType } = d;
      if (dieType === "d10" || dieType === "d00") {
        const pixel = central.getPixelConnect(d.pixelId);
        if (pixel instanceof Pixel) {
          const profile = readProfile(d.profileUuid, store.getState().library);
          dispatch({
            type: "registerDie",
            pixel,
            profile,
            onRegistered: () => {
              const onRoll = (ev: PixelEventMap["rollState"]) => {
                console.log(
                  `Pixel ${unsigned32ToHex(d.pixelId)} ${ev.state} ${ev.face}`
                );
                dispatch({
                  type: "rollState",
                  ...ev,
                  dieType,
                  onResult: (result) => {
                    setTimeout(() => {
                      if (result >= 99) {
                        store.dispatch(incrementRollToWinSuccesses());
                      }
                      store.dispatch(incrementRollToWinCounter());
                    }, 0);
                  },
                });
              };
              pixel.addEventListener("rollState", onRoll);
              disposers.push(() => {
                dispatch({
                  type: "unregisterDie",
                  pixelId: d.pixelId,
                });
                pixel.removeEventListener("rollState", onRoll);
              });
            },
          });
        }
      }
    }
    return () => {
      disposers.forEach((d) => d());
    };
  }, [central, pairedDice, store]);

  const pairedMPCs = useAppSelector((state) => state.pairedMPCs.paired);
  React.useEffect(() => {
    dispatch({ type: "registerMPCs", pairedMPCs });
  }, [central, pairedMPCs]);

  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
  }, [progress]);
  const animStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        rainbowColors.map((_, i) =>
          Math.min(1, Math.max(0, (i - 0.5) / (rainbowColors.length - 2)))
        ),
        rainbowColors
      ),
    };
  });

  return (
    <Pressable
      style={{ height: "100%" }}
      onLongPress={() => {
        dispatch({ type: "resetRolls" });
        clearTimeout(resetTimeoutIdRef.current);
        resetTimeoutIdRef.current = undefined;
      }}
    >
      <Animated.View
        style={[
          typeof diceState.d10 === "number" && typeof diceState.d00 === "number"
            ? animStyle
            : undefined,
          { flex: 1 },
        ]}
      >
        {/* <PageHeader mode="arrow-left" onGoBack={navigation.goBack}>
        Roll To Win
      </PageHeader> */}
        <View style={{ flex: 0.3 }} />
        <View
          style={{
            flex: 0.6,
            aspectRatio: 1,
            marginLeft: "10%",
            alignSelf: "center",
          }}
        >
          {(diceState.d00 === "rolling" || diceState.d10 === "rolling") && (
            <AnimatedImage
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              source={require("#/images/luna.gif")}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </View>
        <View style={{ flex: 0.3 }} />
        <View style={{ flexDirection: "row" }}>
          <RollValue
            value={diceState.d00}
            style={{
              flex: 0.6,
              alignItems: "flex-end",
              marginRight: 20,
            }}
          />
          <RollValue
            value={diceState.d10}
            style={{
              flex: 0.45,
              alignItems: "flex-start",
            }}
          />
        </View>
        <View style={{ flex: 1 }} />
      </Animated.View>
    </Pressable>
  );
}

export function RollToWinScreenScreenScreen({
  navigation,
}: RollToWinScreenProps) {
  return (
    <AppBackground>
      <RollToWinScreenScreenPage navigation={navigation} />
    </AppBackground>
  );
}

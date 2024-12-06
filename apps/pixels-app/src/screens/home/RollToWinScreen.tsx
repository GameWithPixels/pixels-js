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

// https://freesound.org/people/Fupicat/sounds/527650/
import fupicatSound from "#/demo/fupicat_winsquare.wav";
import { PairedMPC } from "~/app/PairedMPC";
import { useAppSelector, useAppStore } from "~/app/hooks";
import { RollToWinScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { playSoundAsync } from "~/features/audio";
import { playAnimOnMPCs } from "~/features/mpcUtils";
import { readProfile } from "~/features/store";
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
    dieAnim: { name: "Rolling Rainbow", delay: 0 },
  },
  rolling: {
    mpcAnim: 0,
  },
  100: {
    mpcAnim: 1,
    dieAnim: { name: "Rolling Rainbow", delay: 2000, loopCount: 3 },
    sound: fupicatSound,
  },
  75: {
    mpcAnim: 2,
    sound: fupicatSound,
  },
  50: {
    mpcAnim: 3,
    sound: fupicatSound,
  },
  0: {
    mpcAnim: 4,
    sound: fupicatSound,
  },
};

function getActionConfig(result: number | "reset" | "rolling"): {
  mpcAnim?: number;
  dieAnim?: { name: string; delay: number; loopCount?: number };
  sound?: AVPlaybackSource;
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
  if (mpcAnim !== undefined && mpcAnim >= 0) {
    playAnimOnMPCs(pairedMPCs, mpcAnim);
  }
  if (dieAnim) {
    setTimeout(() => {
      die10 && playAnimOnDie(die10, dieAnim.name);
      die00 && playAnimOnDie(die00, dieAnim.name);
    }, dieAnim.delay);
  }
  if (sound) {
    playSoundAsync(sound).catch((e) =>
      console.log(`playSoundAsync error: ${e}`)
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
      if (die10 && die00) {
        const { dieType, state: rollState, faceIndex } = action;
        if (rollState === "handling" || rollState === "rolling") {
          if (state[dieType] === undefined) {
            playAction({ result: "rolling", ...state });
            return { ...state, [dieType]: "rolling" };
          }
        } else if (typeof state[dieType] !== "number") {
          if (rollState !== "rolled") {
            console.log("STILL");
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
            }
            return newState;
          }
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
                dispatch({ type: "rollState", ...ev, dieType });
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

  const progress = useSharedValue(-100);
  const animStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        progress.value === -100
          ? "transparent"
          : interpolateColor(
              progress.value,
              rainbowColors.map((_, i) =>
                Math.min(1, Math.max(0, (i - 0.5) / (rainbowColors.length - 2)))
              ),
              rainbowColors
            ),
    };
  });
  React.useEffect(() => {
    if (
      typeof diceState.d10 === "number" &&
      typeof diceState.d00 === "number"
    ) {
      progress.value = 0;
      progress.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    } else {
      progress.value = -100;
    }
  }, [diceState.d00, diceState.d10, progress]);

  return (
    <Pressable
      style={{ height: "100%" }}
      onLongPress={() => dispatch({ type: "resetRolls" })}
    >
      <Animated.View style={[animStyle, { flex: 1 }]}>
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

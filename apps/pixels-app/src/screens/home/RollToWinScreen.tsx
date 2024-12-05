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
import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "react-native-paper";
import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

import { PairedMPC } from "~/app/PairedMPC";
import { useAppSelector, useAppStore } from "~/app/hooks";
import { RollToWinScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { playSoundAsync } from "~/features/audio";
import { playAnimOnMPCs } from "~/features/mpcUtils";
import { readProfile } from "~/features/store";
import { usePixelsCentral } from "~/hooks";

type DieInfo = { pixel: Pixel; profile: Profiles.Profile };

function playAnimOnDie({ pixel, profile }: DieInfo, animName: string) {
  const anims = profile.collectAnimations();
  console.log(`Anims: ${anims.map((a) => a.name).join(", ")}`);
  const animationIndex = anims.findIndex((a) => a.name === animName);
  if (animationIndex >= 0) {
    pixel
      .sendMessage(safeAssign(new PlayProfileAnimation(), { animationIndex }))
      .catch((e) => console.log(`playProfileAnim error ${e}`));
  } else {
    console.log(
      `Animation ${animName} not found for ${pixel.dieType} ${unsigned32ToHex(pixel.pixelId)}`
    );
  }
}

const ResultConfig = {
  reset: {
    mpcAnim: 1,
    dieAnim: { name: "Rolling Rainbow", delay: 0 },
  },
  rolling: {
    mpcAnim: 1,
  },
  100: {
    mpcAnim: 1,
    dieAnim: { name: "Rolling Rainbow", delay: 2000 },
    // https://freesound.org/people/Fupicat/sounds/527650/
    sound: require("#/demo/fupicat_winsquare.wav"),
  },
  75: {
    mpcAnim: 2,
  },
  50: {
    mpcAnim: 3,
  },
  0: {
    mpcAnim: 4,
  },
};

function getActionConfig(result: number | "reset" | "rolling"): {
  mpcAnim: number;
  dieAnim?: { name: string; delay: number };
  sound?: string;
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
    | ({ type: "registerDie" } & DieInfo)
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
        return { ...state, die10: { pixel, profile } };
      }
      if (pixel.dieType === "d00" && !state.die00) {
        console.log(`REGISTER ${pixel.dieType}`);
        return { ...state, die00: { pixel, profile } };
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
      <Text style={{ fontSize: 200 }}>{v}</Text>
    </View>
  );
}

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
          dispatch({ type: "registerDie", pixel, profile });
          const onRoll = (ev: PixelEventMap["rollState"]) => {
            console.log(
              `Pixel ${unsigned32ToHex(d.pixelId)} ${ev.state} ${ev.face}`
            );
            dispatch({ type: "rollState", ...ev, dieType });
          };
          pixel.addEventListener("rollState", onRoll);
          disposers.push(() => pixel.removeEventListener("rollState", onRoll));
        }
      }
    }
    return () => {
      disposers.forEach((d) => d());
    };
  }, [central, pairedDice, store]);

  return (
    <Pressable
      style={{ height: "100%" }}
      onLongPress={() => dispatch({ type: "resetRolls" })}
    >
      {/* <PageHeader mode="arrow-left" onGoBack={navigation.goBack}>
        Roll To Win
      </PageHeader> */}
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: "row" }}>
        <RollValue
          value={diceState.d00}
          style={{
            flex: 0.7,
            alignItems: "flex-end",
            marginRight: 20,
          }}
        />
        <RollValue
          value={diceState.d10}
          style={{
            flex: 0.6,
            alignItems: "flex-start",
          }}
        />
      </View>
      <View style={{ flex: 1 }} />
      {(diceState.d00 === "rolling" || diceState.d10 === "rolling") && (
        <Image
          source={require("#/images/luna.gif")}
          style={{
            position: "absolute",
            top: 60,
            width: 200,
            height: 200,
            alignSelf: "center",
          }}
        />
      )}
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

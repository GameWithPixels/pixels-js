import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps, View } from "react-native";

import { DiceSetType, getDiceSetDiceList } from "~/features/set";

const dieShadow = require("!images/lcc/dieShadow.png");
const lccImage = require("!images/lcc/lcc.png");

function getDieImage(dieType: PixelDieType, colorway: PixelColorway) {
  switch (dieType) {
    case "d20":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d20-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d20-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d20-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d20-auroraSky.png");

        case "clear":
          return require("!images/dice/d20-clear.png");

        case "whiteAurora":
          return require("!images/dice/d20-whiteAurora.png");
      }
      break;
    case "d12":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d12-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d12-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d12-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d12-auroraSky.png");

        case "clear":
          return require("!images/dice/d12-clear.png");

        case "whiteAurora":
          return require("!images/dice/d12-whiteAurora.png");
      }
      break;
    case "d00":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d00-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d00-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d00-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d00-auroraSky.png");

        case "clear":
          return require("!images/dice/d00-clear.png");

        case "whiteAurora":
          return require("!images/dice/d00-whiteAurora.png");
      }
      break;
    case "d10":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d10-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d10-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d10-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d10-auroraSky.png");

        case "clear":
          return require("!images/dice/d10-clear.png");

        case "whiteAurora":
          return require("!images/dice/d10-whiteAurora.png");
      }
      break;
    case "d8":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d8-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d8-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d8-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d8-auroraSky.png");

        case "clear":
          return require("!images/dice/d8-clear.png");

        case "whiteAurora":
          return require("!images/dice/d8-whiteAurora.png");
      }
      break;
    case "d6":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d6-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d6-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d6-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d6-auroraSky.png");

        case "clear":
          return require("!images/dice/d6-clear.png");

        case "whiteAurora":
          return require("!images/dice/d6-whiteAurora.png");
      }
      break;
    case "d4":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d4-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d4-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d4-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d4-auroraSky.png");

        case "clear":
          return require("!images/dice/d4-clear.png");

        case "whiteAurora":
          return require("!images/dice/d4-whiteAurora.png");
      }
      break;
    case "d6pipped":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d6pipped-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d6pipped-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d6pipped-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d6pipped-auroraSky.png");

        case "clear":
          return require("!images/dice/d6pipped-clear.png");

        case "whiteAurora":
          return require("!images/dice/d6pipped-whiteAurora.png");
      }
      break;
    case "d6fudge":
      switch (colorway) {
        case "onyxBlack":
          return require("!images/dice/d6fudge-onyxBlack.png");

        case "hematiteGrey":
          return require("!images/dice/d6fudge-hematiteGrey.png");

        case "midnightGalaxy":
          return require("!images/dice/d6fudge-midnightGalaxy.png");

        case "auroraSky":
          return require("!images/dice/d6fudge-auroraSky.png");

        case "clear":
          return require("!images/dice/d6fudge-clear.png");

        case "whiteAurora":
          return require("!images/dice/d6fudge-whiteAurora.png");
      }
  }
  return require("!images/dice/unknown.png");
}

export function DiceSetImage({
  setType,
  colorway,
  style,
  ...props
}: { setType: DiceSetType; colorway: PixelColorway } & Omit<
  ImageProps,
  "source"
>) {
  const dice = getDiceSetDiceList(setType);
  return (
    <View>
      <Image
        source={lccImage}
        resizeMode="contain"
        style={[
          {
            width: 340,
            height: 140,
          },
          style,
        ]}
        {...props}
      />
      {dice.map((dt, i) => {
        const style = {
          position: "absolute",
          width: 74,
          height: 74,
        } as const;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              top: 61 - 51.5 * (i < 4 ? 0 : 1),
              left: -8 + 58.5 * (i % 4) + 28 * (i < 4 ? 0 : 1),
            }}
          >
            <Image source={dieShadow} style={style} resizeMode="contain" />
            <Image
              source={getDieImage(dt, colorway)}
              style={style}
              resizeMode="contain"
            />
          </View>
        );
      })}
    </View>
  );
}

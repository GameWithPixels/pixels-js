import {
  DiceUtils,
  Pixel,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelRollState,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";

import { dieTypes } from "./dieTypes";
import {
  Action,
  ColorDesign,
  Condition,
  PixelAnimation,
  PixelProfile,
  Rule,
} from "./temp";

const names = [
  "Verkol",
  "Rutriel",
  "Hudin",
  "Lutos",
  "Zoril",
  "Joseph",
  "Louie",
  "Cameron",
  "Theo",
  "Owen",
  "Cot",
  "Orott",
  "Noliss",
  "Draffip",
  "Dhorit",
  "Shilgak",
  "Zhalgir",
  "Uffiss",
  "Zhobisq",
  "Affak",
  "Czega",
  "Duzzun",
  "Penir",
  "Nofor",
  "Cziggad",
  "Damir",
  "Dmitriy",
  "Ilarion",
  "Leontiy",
  "Krasimir",
] as const;

const allScannedPixels: ScannedPixel[] = [];
const listeners: ((sp: ScannedPixel) => void)[] = [];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNext<T>(arr: readonly T[]): T {
  return arr[allScannedPixels.length % arr.length];
}

export function createScannedPixel(): ScannedPixel {
  const id = 1 + allScannedPixels.length;
  const name = pick(names);
  const dieType = pickNext(dieTypes) as PixelDieType;
  const ledCount = DiceUtils.getLEDCount(dieType);
  const sp = {
    systemId: String(id),
    address: id,
    pixelId: id,
    name,
    ledCount,
    colorway: pickNext(
      Object.keys(PixelColorwayValues).filter(
        (c) => c !== "unknown" && c !== "custom"
      )
    ) as PixelColorway,
    dieType,
    firmwareDate: new Date(),
    rssi: Math.round(-40 - 40 * Math.random()),
    batteryLevel: Math.round(1 + 99 * Math.random()),
    isCharging: false,
    rollState: "onFace" as PixelRollState,
    currentFace: randomRoll(dieType),
    timestamp: new Date(),
  };
  allScannedPixels.push(sp);
  for (const f of listeners) {
    f(sp);
  }
  return sp;
}

export function createAnimation(name: string): PixelAnimation {
  return new PixelAnimation({ uuid: Math.random().toString(), name });
}

export function getDefaultAnimations(): PixelAnimation[] {
  return [
    new PixelAnimation({ name: "Red to Blue" }),
    new PixelAnimation({ name: "Rainbow" }),
    new PixelAnimation({ name: "Rainbow Falls" }),
    new PixelAnimation({ name: "Blue to Red" }),
    new PixelAnimation({ name: "Three Red Blinks" }),
    new PixelAnimation({ name: "Picked up Solid" }),
    new PixelAnimation({ name: "Long Red Blink" }),
    new PixelAnimation({ name: "Red to Yellow" }),
    new PixelAnimation({ name: "Waterfall" }),
    new PixelAnimation({ name: "Rainbow All Faces" }),
    new PixelAnimation({ name: "Rolling Animation" }),
    new PixelAnimation({ name: "Flicker On" }),
    new PixelAnimation({ name: "Rotating Rings" }),
    new PixelAnimation({ name: "Red to Green Rotation" }),
    new PixelAnimation({ name: "Trifold" }),
    new PixelAnimation({ name: "Accelerating" }),
  ];
}

export const ProfileGroups = ["mage level 1", "warrior", "rogue cleric"];

export function createProfile(
  name: string,
  description?: string
): PixelProfile {
  return new PixelProfile({
    uuid: Math.random().toString(),
    name,
    description:
      description ??
      pick([
        "",
        "Lorem ipsum dolor sit amet",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      ]),
    group: pick(["", ...ProfileGroups]),
    favorite: Math.random() < 0.3,
    rules: [
      new Rule(new Condition("rolled"), {
        actions: [new Action("playAnimation")],
      }),
    ],
  });
}

export const defaultProfile = createProfile(
  "Default",
  "Profile set in the factory"
);

export function getDefaultProfiles(): PixelProfile[] {
  return [
    createProfile("Rainbow"),
    createProfile("Speak Numbers"),
    createProfile("Flashy"),
    createProfile("Rolling Rainbow"),
    createProfile("Pastel"),
    createProfile("Fireball"),
    createProfile("Simple"),
    createProfile("Toned Down"),
    defaultProfile,
  ];
}

export function getDefaultColorDesigns(): ColorDesign[] {
  return [
    new ColorDesign({ name: "Orange To Purple " }),
    new ColorDesign({ name: "Simple" }),
    new ColorDesign({ name: "Colored Twinkle" }),
    new ColorDesign({ name: "Tiger" }),
    new ColorDesign({ name: "Rainbow Falls" }),
    new ColorDesign({ name: "Down and Up" }),
    new ColorDesign({ name: "Circles" }),
    new ColorDesign({ name: "Twinkle All" }),
    new ColorDesign({ name: "Flicker On" }),
    new ColorDesign({ name: "Noise" }),
    new ColorDesign({ name: "Rotating Rings" }),
  ];
}

export function getRollStats(pixel: Pixel): number[] {
  return Array(pixel.dieFaceCount)
    .fill(0)
    .map(() => 10 + Math.round(15 * Math.random()));
}

export function randomRoll(dieType: PixelDieType): number {
  const faceCount = DiceUtils.getFaceCount(dieType);
  return (
    (Math.ceil(Math.random() * faceCount) -
      (dieType === "d00" || dieType === "d10" ? 1 : 0)) *
    (dieType === "d10" ? 10 : 1)
  );
}

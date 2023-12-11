import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getDefaultColorDesigns(): Profiles.ColorDesign[] {
  return [
    new Profiles.ColorDesign({ name: "Orange To Purple " }),
    new Profiles.ColorDesign({ name: "Simple" }),
    new Profiles.ColorDesign({ name: "Colored Twinkle" }),
    new Profiles.ColorDesign({ name: "Tiger" }),
    new Profiles.ColorDesign({ name: "Rainbow Falls" }),
    new Profiles.ColorDesign({ name: "Down and Up" }),
    new Profiles.ColorDesign({ name: "Circles" }),
    new Profiles.ColorDesign({ name: "Twinkle All" }),
    new Profiles.ColorDesign({ name: "Flicker On" }),
    new Profiles.ColorDesign({ name: "Noise" }),
    new Profiles.ColorDesign({ name: "Rotating Rings" }),
  ];
}
export function getDefaultAnimations(): Profiles.Animation[] {
  return [
    new Profiles.AnimationFlashes({ name: "Red to Blue" }),
    new Profiles.AnimationFlashes({ name: "Rainbow" }),
    new Profiles.AnimationFlashes({ name: "Rainbow Falls" }),
    new Profiles.AnimationFlashes({ name: "Blue to Red" }),
    new Profiles.AnimationFlashes({ name: "Three Red Blinks" }),
    new Profiles.AnimationFlashes({ name: "Picked up Solid" }),
    new Profiles.AnimationFlashes({ name: "Long Red Blink" }),
    new Profiles.AnimationFlashes({ name: "Red to Yellow" }),
    new Profiles.AnimationFlashes({ name: "Waterfall" }),
    new Profiles.AnimationFlashes({ name: "Rainbow All Faces" }),
    new Profiles.AnimationFlashes({ name: "Rolling Animation" }),
    new Profiles.AnimationFlashes({ name: "Flicker On" }),
    new Profiles.AnimationFlashes({ name: "Rotating Rings" }),
    new Profiles.AnimationFlashes({ name: "Red to Green Rotation" }),
    new Profiles.AnimationFlashes({ name: "Trifold" }),
    new Profiles.AnimationFlashes({ name: "Accelerating" }),
  ];
}
export function createAnimation(name: string): Profiles.Animation {
  return new Profiles.AnimationFlashes({
    uuid: Math.random().toString(),
    name,
  });
}

export const ProfileGroups = ["mage level 1", "warrior", "rogue cleric"];

export function createProfile(
  name: string,
  description?: string
): Profiles.Profile {
  const rule = new Profiles.Rule(new Profiles.ConditionRolled());
  rule.actions.push(new Profiles.ActionPlayAnimation());
  return new Profiles.Profile({
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
    rules: [rule],
  });
}

export const defaultProfile = createProfile(
  "Default",
  "Profile set in the factory"
);

export function createDefaultProfiles(): Profiles.Profile[] {
  return [
    defaultProfile,
    createProfile("Rainbow"),
    createProfile("Speak Numbers"),
    createProfile("Flashy"),
    createProfile("Rolling Rainbow"),
    createProfile("Pastel"),
    createProfile("Fireball"),
    createProfile("Simple"),
    createProfile("Toned Down"),
  ];
}

export function generateRollStats(pixel: Pixel): number[] {
  return Array(pixel.dieFaceCount)
    .fill(0)
    .map(() => 10 + Math.round(15 * Math.random()));
}

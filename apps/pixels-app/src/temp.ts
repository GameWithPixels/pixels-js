import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

export const ProfileGroups = ["mage level 1", "warrior", "rogue cleric"];

export const factoryProfile = new Profiles.Profile({
  uuid: "default",
  name: "Default",
  description: "Profile set in the factory",
  rules: [
    new Profiles.Rule(new Profiles.ConditionRolled(), {
      actions: [new Profiles.ActionPlayAnimation()],
    }),
  ],
});

export function generateRollStats(pixel: Pixel): number[] {
  return Array(pixel.dieFaceCount)
    .fill(0)
    .map(() => 10 + Math.round(15 * Math.random()));
}

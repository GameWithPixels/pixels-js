import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { makeObservable } from "mobx";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

export const factoryProfile = createProfile(
  "Default",
  "Profile set in the factory"
);

export function createAnimation(name: string): Profiles.Animation {
  return new Profiles.AnimationFlashes({
    uuid: Math.random().toString(),
    name,
  });
}

export function generateRollStats(pixel: Pixel): number[] {
  return Array(pixel.dieFaceCount)
    .fill(0)
    .map(() => 10 + Math.round(15 * Math.random()));
}

// export function getOrAddRule(
//   profile: Profiles.Profile,
//   conditionType: Profiles.ConditionType
// ): number {
//   const index = profile.rules.findIndex(
//     (r) => r.condition.type === conditionType
//   );
//   if (index < 0) {
//     profile.rules.push(
//       makeObservable(new Profiles.Rule(Profiles.createCondition(conditionType)))
//     );
//   }
//   return index < 0 ? profile.rules.length - 1 : index;
// }

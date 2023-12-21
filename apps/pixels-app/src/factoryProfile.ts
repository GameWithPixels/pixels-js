import { Profiles } from "@systemic-games/react-native-pixels-connect";

export const factoryProfile = new Profiles.Profile({
  uuid: "factory",
  name: "Default",
  description: "Factory profile",
  rules: [
    new Profiles.Rule(new Profiles.ConditionRolled(), {
      actions: [new Profiles.ActionPlayAnimation()],
    }),
  ],
});

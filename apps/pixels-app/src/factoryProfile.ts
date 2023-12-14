import { Profiles } from "@systemic-games/react-native-pixels-connect";

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

import { Profiles } from "@systemic-games/react-native-pixels-connect";

export const EditorAnimationFlags = Object.freeze({
  connection: Object.freeze(
    Object.keys(Profiles.ConnectionFlagsValues) as Profiles.ConnectionFlags[]
  ),

  battery: Object.freeze(
    (
      Object.keys(Profiles.BatteryFlagsValues) as Profiles.BatteryFlags[]
    ).filter((t) => t !== "ok")
  ),

  helloGoodbye: Object.freeze(
    (
      Object.keys(
        Profiles.HelloGoodbyeFlagsValues
      ) as Profiles.HelloGoodbyeFlags[]
    ).filter((t) => t !== "goodbye")
  ),
});

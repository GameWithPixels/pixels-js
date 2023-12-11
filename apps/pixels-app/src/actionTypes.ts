import { Profiles } from "@systemic-games/react-native-pixels-connect";

export const actionTypes = (
  Object.keys(Profiles.ActionTypeValues) as Profiles.ActionType[]
).filter((t) => t !== "none");

export const connectionFlags = Object.keys(
  Profiles.ConnectionFlagsValues
) as Profiles.ConnectionFlags[];

export const batteryFlags = Object.keys(
  Profiles.BatteryFlagsValues
) as Profiles.BatteryFlags[];

export const helloGoodbyeFlags = Object.keys(
  Profiles.HelloGoodbyeFlagsValues
) as Profiles.HelloGoodbyeFlags[];

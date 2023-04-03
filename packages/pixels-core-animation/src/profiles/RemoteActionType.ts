import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of remote actions.
 * @category Profile Action
 * @enum
 */
export const RemoteActionTypeValues = {
  none: enumValue(0),
  playAudioClip: enumValue(),
  makeWebRequest: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link RemoteActionTypeValues}.
 * @category Profile Action
 */
export type RemoteActionType = keyof typeof RemoteActionTypeValues;

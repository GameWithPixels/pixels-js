import {
  BatteryEvent,
  MessageOrType,
  MessageType,
  Pixel,
  PixelMutableProps,
  RequestTelemetry,
  RollEvent,
  Telemetry,
  TelemetryRequestModeValues,
  Temperature,
} from "@systemic-games/pixels-core-connect";
import { assertNever, safeAssign } from "@systemic-games/pixels-core-utils";
import React from "react";

import { usePixelStatus } from "./usePixelStatus";

function repeatSendMessage(
  pixel: Pixel,
  refreshInt: number,
  msgType: MessageType,
  msgToSend: MessageType,
  msgHandler: (msg: MessageOrType) => void,
  setLastError: (error: Error) => void
): () => void {
  // Message sending function
  const request = () => pixel.sendMessage(msgToSend).catch(setLastError);
  // Listen for the response message
  pixel.addMessageListener(msgType, msgHandler);
  // Send message with given interval when Pixel is ready
  const id = setInterval(request, refreshInt);
  // And request value immediately
  request();
  // Unsubscribe from listeners
  return () => {
    pixel.removeMessageListener(msgType, msgHandler);
    clearInterval(id);
  };
}

/**
 * Pixel value names map for {@link usePixelEvent} function.
 * Maps the value name with the corresponding data type.
 */
export interface UsePixelValueNamesMap {
  /** Updates with the result of a roll.
   *  @remarks
   *  - The value is an object with the face number rather than just a number
   *    so rolling the same face will trigger a state change nonetheless.
   *  - No value is returned until a roll is made. */
  rollFace: Pick<RollEvent, "face">;
  /** Updates with the roll state and face on any roll event but not more often
   *  than specified by the refresh interval argument, except when there is a
   *  roll result (i.e. `state === 'onFace'`) in which case it updates
   *  immediately.
   *  @remarks No value is returned until a roll event occurs. */
  roll: RollEvent;
  /** Updates with the battery level and charging status. */
  battery: BatteryEvent;
  /** Updates with the temperature in Celsius. */
  temperature: {
    mcuTemperature: number; // Microcontroller temperature in celsius
    batteryTemperature: number; // Battery temperature in celsius
  };
  /** Updates with the telemetry data. */
  telemetry: Telemetry;
  /** Updates with the received signal strength indicator (RSSI) in dBm. */
  rssi: number;
}

/**
 * React Hook that updates when the specified value of the given Pixel changes.
 * @param pixel A Pixel for which to watch a value.
 * @param valueName The name of the value to watch, see keys of
 *                  {@link UsePixelValueNamesMap} for the complete list.
 * @param options Optional arguments.
 * @returns An array with:
 * - the value being watched,
 * - a stable dispatch function that may be called to start and stop
 *   watching the Pixel's value,
 * - the last encountered error.
 * @remarks
 * - By default this hook immediately starts watching the Pixel's value.
 *   See the function arguments to change that behavior.
 * - The returned value is kept even after a disconnection event.
 */
export function usePixelEvent<T extends keyof UsePixelValueNamesMap>(
  pixel: Pixel | undefined,
  valueName: T,
  options?: {
    /** The minimum time interval in milliseconds between two updates.
     *  Ignored for "roll" value.
     *  @defaultValue 5000 */
    minInterval?: number;
    /** Whether to wait on a call to the dispatcher with "start" before
     *  watching the value.
     *  Otherwise the hook returns the required value as soon the Pixel
     *  is connected.
     * @defaultValue false */
    explicitStart?: boolean;
  }
): [
  UsePixelValueNamesMap[T] | undefined,
  (action: "start" | "stop") => void,
  Error?,
] {
  type ValueType = UsePixelValueNamesMap[T];
  const [lastError, setLastError] = React.useState<Error>();
  const [value, setValue] = React.useState<ValueType>();
  const [isActive, setIsActive] = React.useState(
    options?.explicitStart ?? true
  );
  const stateRef = React.useRef<{
    lastPixel?: Pixel;
    lastValueName?: keyof UsePixelValueNamesMap;
    lastValue?: ValueType;
    lastTime: number;
    timeoutId?: ReturnType<typeof setTimeout>;
  }>({ lastTime: 0 });

  // Options default values
  const minInterval = options?.minInterval ?? 5000;

  const isReady = usePixelStatus(pixel) === "ready";
  React.useEffect(() => {
    if (
      stateRef.current.lastPixel !== pixel ||
      stateRef.current.lastValueName !== valueName
    ) {
      // Clear value if we are watching a different Pixel
      // or a different value
      stateRef.current.lastValueName = valueName;
      stateRef.current.lastPixel = pixel;
      setValue(undefined);
    }
    if (pixel && valueName && isReady && isActive) {
      switch (valueName) {
        case "rollFace": {
          // We don't immediately set the state value,
          // rather we wait on the next roll to update it
          const onRoll = (roll: number) =>
            setValue({ face: roll } as ValueType);
          pixel.addEventListener("roll", onRoll);
          return () => {
            pixel.removeEventListener("roll", onRoll);
          };
        }

        case "roll": {
          // Set the state value with the current roll state
          setValue({
            face: pixel.currentFace,
            state: pixel.rollState,
          } as ValueType);
          // Create roll event listener
          const onRollState = (rollState: RollEvent) =>
            setValue((prevValue) => {
              const now = Date.now();
              // Time left before the value can be updated
              const timeLeft =
                minInterval - (Date.now() - stateRef.current.lastTime);
              // Immediately update the value if we have a state change,
              // or the state is onFace (we don't to miss any of those)
              // or if we are passed the given refresh interval
              if (
                timeLeft <= 0 ||
                rollState.state === "onFace" ||
                (prevValue as any)?.state !== rollState.state
              ) {
                stateRef.current.lastTime = now;
                clearTimeout(stateRef.current.timeoutId);
                stateRef.current.timeoutId = undefined;
                return rollState as ValueType;
              } else {
                // Store value and update later
                stateRef.current.lastValue = rollState as ValueType;
                if (!stateRef.current.timeoutId) {
                  stateRef.current.timeoutId = setTimeout(() => {
                    const now = Date.now();
                    setValue(() => {
                      stateRef.current.lastTime = now;
                      return stateRef.current.lastValue;
                    });
                  }, timeLeft);
                }
                return prevValue;
              }
            });
          // Listen to roll events
          pixel.addEventListener("rollState", onRollState);
          return () => {
            pixel.removeEventListener("rollState", onRollState);
            clearTimeout(stateRef.current.timeoutId);
            stateRef.current.timeoutId = undefined;
            // eslint-disable-next-line react-hooks/exhaustive-deps
            stateRef.current.lastTime = 0;
          };
        }

        case "battery": {
          // Set the state value with the current battery state
          setValue({
            level: pixel.batteryLevel,
            isCharging: pixel.isCharging,
          } as ValueType);
          // Create battery event listener
          const onBattery = (batteryData: BatteryEvent) =>
            setValue(batteryData as ValueType);
          // Listen to battery events
          pixel.addEventListener("battery", onBattery);
          return () => {
            pixel.removeEventListener("battery", onBattery);
          };
        }

        case "temperature":
          return repeatSendMessage(
            pixel,
            minInterval,
            "temperature",
            "requestTemperature",
            (msg: MessageOrType) => {
              const tmp = msg as Temperature;
              const val = {
                mcuTemperature: tmp.mcuTemperatureTimes100 / 100,
                batteryTemperature: tmp.batteryTemperatureTimes100 / 100,
              };
              setValue(val as ValueType);
            },
            setLastError
          );

        case "telemetry": {
          // Telemetry listener
          const onTelemetry = (msg: MessageOrType) =>
            setValue(msg as ValueType);
          // Listen for telemetry messages
          pixel.addMessageListener("telemetry", onTelemetry);
          // Request for telemetry updates
          pixel
            .sendMessage(
              safeAssign(new RequestTelemetry(), {
                requestMode: TelemetryRequestModeValues.automatic,
                minInterval,
              })
            )
            .catch(setLastError);
          return () => {
            // Cleanup
            pixel.removeMessageListener("telemetry", onTelemetry);
            // Request for stopping telemetry updates if connected (ignore any error)
            pixel.sendMessage(new RequestTelemetry()).catch(() => {});
          };
        }

        case "rssi": {
          // We don't immediately set the state value for RSSI as the value
          // stored in the Pixel instance is probably outdated.
          // Create RSSI event listener
          const onRssi = ({ rssi }: PixelMutableProps) =>
            setValue(rssi as ValueType);
          // Listen to battery events
          pixel.addPropertyListener("rssi", onRssi);
          // Request Pixel to send RSSI
          pixel.reportRssi(true, minInterval).catch(setLastError);
          return () => {
            pixel.removePropertyListener("rssi", onRssi);
            pixel.reportRssi(false).catch(() => {});
          };
        }

        default:
          assertNever(valueName, `Unknown value name: ${valueName}`);
      }
    }
  }, [isActive, pixel, minInterval, valueName, isReady]);

  // Create the dispatch function
  const dispatch = React.useCallback(
    (action: "start" | "stop") => setIsActive(action === "start"),
    []
  );
  const checkedValue =
    stateRef.current.lastValueName === valueName ? value : undefined;
  return [checkedValue, dispatch, lastError];
}

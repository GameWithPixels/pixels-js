import {
  Pixel,
  MessageOrType,
  MessageTypeValues,
  Telemetry,
  RequestTelemetry,
  PixelStatus,
  Temperature,
  MessageTypeNames,
  PixelRollData,
  PixelBatteryData,
  MessageType,
  PixelEventMap,
  TelemetryRequestModeValues,
} from "@systemic-games/pixels-core-connect";
import {
  assertNever,
  EventReceiver,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

function _autoRequest(
  pixel: Pixel,
  refreshInt: number,
  request: () => Promise<unknown>,
  forceUpdate: () => void
): () => void {
  // Force updating on status change
  const onStatus = (status: PixelStatus) => {
    if (status === "ready" || status === "disconnected") {
      forceUpdate();
    }
  };
  // Request value with given interval
  const id = setInterval(request, refreshInt);
  // And request value immediately
  request();
  return () => {
    // Cleanup
    clearInterval(id);
    pixel.removeEventListener("status", onStatus);
  };
}

function _requestValue(
  pixel: Pixel,
  refreshInt: number,
  msgName: MessageTypeNames,
  msgToSend: MessageType,
  msgHandler: (msg: MessageOrType) => void,
  setLastError: (error: Error) => void,
  forceUpdate: () => void
): () => void {
  // Value requester
  const request = () => pixel.sendMessage(msgToSend).catch(setLastError);
  // Listen for the given response message
  pixel.addMessageListener(msgName, msgHandler);
  // Setup auto requesting
  const unsubscribe = _autoRequest(pixel, refreshInt, request, forceUpdate);
  return () => {
    pixel.removeMessageListener(msgName, msgHandler);
    unsubscribe();
  };
}

function _requestProp<T extends keyof PixelEventMap>(
  pixel: Pixel,
  refreshInt: number,
  propEvent: T,
  queryFunc: () => Promise<unknown>,
  evHandler: EventReceiver<PixelEventMap[T]>,
  setLastError: (error: Error) => void,
  forceUpdate: () => void
): () => void {
  // Listen for the given event
  pixel.addEventListener(propEvent, evHandler);
  // Value requester
  const request = () => queryFunc().catch(setLastError);
  // Setup auto requesting
  const unsubscribe = _autoRequest(pixel, refreshInt, request, forceUpdate);
  return () => {
    pixel.removeEventListener(propEvent, evHandler);
    unsubscribe();
  };
}

/**
 * Pixel value names map for {@link usePixelValue} function.
 * Maps the value name with the corresponding data type.
 */
export interface UsePixelValueNamesMap {
  /** Updates with the result of a roll.
   *  @remarks
   *  - The value is an object with the face number rather than just a number
   *    so rolling the same face will trigger a state change nonetheless.
   *  - No value is returned until a roll is made. */
  roll: Pick<PixelRollData, "face">;
  /** Updates with the roll state and face on any roll event but not more often
   *  than specified by the refresh interval argument, except when there is a
   *  roll result (i.e. `state === 'onFace'`) in which case it updates
   *  immediately.
   *  @remarks No value is returned until a roll event occurs. */
  rollState: PixelRollData;
  /** Updates with the battery level and charging status. */
  battery: PixelBatteryData;
  /** Updates with the RSSI value. */
  rssi: number;
  /** Updates with the temperature in Celsius. */
  temperature: {
    mcuTemperature: number; // Microcontroller temperature in celsius
    batteryTemperature: number; // Battery temperature in celsius
  };
  /** Updates with the telemetry data. */
  telemetry: Telemetry;
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
export default function usePixelValue<T extends keyof UsePixelValueNamesMap>(
  pixel?: Pixel,
  valueName?: T,
  options?: {
    /** The minimum time interval in milliseconds between two updates.
     *  Ignored for "roll" value.
     *  @defaultValue 5000 */
    minInterval?: number;
    /** Whether to wait on a call to the dispatcher with "start" before
     *  watching the value. @defaultValue false */
    waitOnStart?: boolean;
  }
): [
  UsePixelValueNamesMap[T] | undefined,
  (action: "start" | "stop") => void,
  Error?
] {
  type ValueType = UsePixelValueNamesMap[T];
  const [lastError, setLastError] = useState<Error>();
  const [value, setValue] = useState<ValueType>();
  const [isActive, setIsActive] = useState(false);
  const stateRef = useRef<{
    lastPixel?: Pixel;
    lastValueName?: keyof UsePixelValueNamesMap;
    lastValue?: ValueType;
    lastTime: number;
    timeoutId?: ReturnType<typeof setTimeout>;
  }>({ lastTime: 0 });
  const [_, forceUpdate] = useReducer((b) => !b, false);

  // Options default values
  const minInterval = options?.minInterval ?? 5000;
  const waitOnStart = options?.waitOnStart ?? false;

  const status = pixel?.status;
  useEffect(() => {
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
    if (
      pixel &&
      valueName &&
      status === "ready" &&
      (isActive || !waitOnStart)
    ) {
      switch (valueName) {
        case "roll": {
          // We don't immediately set the state value,
          // rather we wait on the next roll to update it
          const onRoll = (roll: number) =>
            setValue({ face: roll } as ValueType);
          pixel.addEventListener("roll", onRoll);
          return () => {
            pixel.removeEventListener("roll", onRoll);
          };
        }

        case "rollState": {
          // Set the state value with the current roll state
          setValue({
            face: pixel.currentFace,
            state: pixel.rollState,
          } as ValueType);
          // Roll event listener
          const onRollState = (rollState: PixelRollData) =>
            setValue((prevValue) => {
              const now = Date.now();
              // Time left before the value can be updated
              const timeLeft =
                minInterval - (Date.now() - stateRef.current.lastTime);
              // Immediately update the value if we have a roll or if we are
              // passed the given refresh interval
              if (rollState.state === "onFace" || timeLeft <= 0) {
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
          // Battery event listener
          const onBattery = (batteryData: PixelBatteryData) =>
            setValue(batteryData as ValueType);
          // Listen to battery events
          pixel.addEventListener("battery", onBattery);
          return () => {
            pixel.removeEventListener("battery", onBattery);
          };
        }

        case "rssi": {
          // We don't immediately set the state value as the current
          // rssi value available with the Pixel instance is probably
          // outdated
          // RSSI event listener
          const onRssi = (rssi: number) => setValue(rssi as ValueType);
          // Listen to battery events
          pixel.addEventListener("rssi", onRssi);
          // Request Pixel to send RSSI
          pixel.reportRssi(true, minInterval).catch(setLastError);
          return () => {
            pixel.reportRssi(false).catch(() => {});
          };
        }

        case "temperature":
          return _requestValue(
            pixel,
            minInterval,
            "temperature",
            MessageTypeValues.requestTemperature,
            (msg: MessageOrType) => {
              const tmp = msg as Temperature;
              const val = {
                mcuTemperature: tmp.mcuTemperatureTimes100 / 100,
                batteryTemperature: tmp.batteryTemperatureTimes100 / 100,
              };
              setValue(val as ValueType);
            },
            setLastError,
            forceUpdate
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
                requestMode: TelemetryRequestModeValues.repeat,
                minInterval,
              })
            )
            .catch(setLastError);
          return () => {
            // Cleanup
            pixel.removeMessageListener("telemetry", onTelemetry);
            if (pixel.status === "ready") {
              // Request for stopping telemetry updates if connected (ignore any error)
              pixel.sendMessage(new RequestTelemetry()).catch(() => {});
            }
          };
        }

        default:
          assertNever(valueName);
      }
    }
  }, [isActive, pixel, minInterval, status, valueName, waitOnStart]);

  // Create the dispatch function
  const dispatch = useCallback(
    (action: "start" | "stop") => setIsActive(action === "start"),
    []
  );
  const checkedValue =
    stateRef.current.lastValueName === valueName ? value : undefined;
  return [checkedValue, dispatch, lastError];
}

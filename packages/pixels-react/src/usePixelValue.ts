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
  BatteryLevel,
} from "@systemic-games/pixels-core-connect";
import { assertNever, EventReceiver } from "@systemic-games/pixels-core-utils";
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
  /** Updates with the value of the last roll. */
  roll: number;
  /** Updates with the roll state and face but not more often than specified
   *  by the refresh interval argument, except when a roll completes
   *  (i.e. `state === 'onFace'`) in which case it updates immediately. */
  rollState: PixelRollData;
  /** Updates with the battery level and charging status. */
  battery: PixelBatteryData;
  /** Updates with the battery level, charging status and voltage
   *  @remarks Since the voltage read from the die is always a little bit
   *  different, the hook will update for every refresh interval. */
  batteryWithVoltage: PixelBatteryData & { voltage: number };
  /** Updates with the RSSI value. */
  rssi: number;
  /** Updates with the temperature in Celsius. */
  temperature: number;
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
 * @remarks By default this hook immediately starts watching the Pixel's value.
 *          See the function arguments to change that behavior.
 */
export default function usePixelValue<T extends keyof UsePixelValueNamesMap>(
  pixel?: Pixel,
  valueName?: T,
  options?: {
    /** The minimum interval between two updates. Ignored for "roll" value.
     *  @defaultValue 1000 */
    refreshInterval?: number;
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
    lastValueName?: keyof UsePixelValueNamesMap;
    lastValue?: ValueType;
    lastTime: number;
    timeoutId?: ReturnType<typeof setTimeout>;
  }>({ lastTime: 0 });
  const [_, forceUpdate] = useReducer((b) => !b, false);

  // Options default values
  const refreshInterval = options?.refreshInterval ?? 1000;
  const waitOnStart = options?.waitOnStart ?? false;

  const status = pixel?.status;
  useEffect(() => {
    if (stateRef.current.lastValueName !== valueName) {
      // Clear value if we are watching a different one
      stateRef.current.lastValueName = valueName;
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
          const onRoll = (roll: number) => setValue(roll as ValueType);
          pixel.addEventListener("roll", onRoll);
          setValue(
            pixel.rollState === "onFace"
              ? (pixel.currentFace as ValueType)
              : undefined
          );
          return () => {
            pixel.removeEventListener("roll", onRoll);
          };
        }

        case "rollState": {
          const onRollState = (rollState: PixelRollData) =>
            setValue((lastValue) => {
              const now = Date.now();
              // Time left before the value can be updated
              const timeLeft =
                refreshInterval - (Date.now() - stateRef.current.lastTime);
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
                return lastValue;
              }
            });
          pixel.addEventListener("rollState", onRollState);
          // Update value immediately
          setValue(() => {
            stateRef.current.lastTime = Date.now();
            return {
              face: pixel.currentFace,
              state: pixel.rollState,
            } as ValueType;
          });
          return () => {
            pixel.removeEventListener("rollState", onRollState);
            clearTimeout(stateRef.current.timeoutId);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            stateRef.current.timeoutId = undefined;
            stateRef.current.lastTime = 0;
          };
        }

        case "battery":
          setValue({
            level: pixel.batteryLevel,
            isCharging: pixel.isCharging,
          } as ValueType);
          return _requestProp(
            pixel,
            refreshInterval,
            "battery",
            () => pixel.queryBattery(),
            (battery) => setValue(battery as ValueType),
            setLastError,
            forceUpdate
          );

        case "batteryWithVoltage":
          return _requestValue(
            pixel,
            refreshInterval,
            "batteryLevel",
            MessageTypeValues.requestBatteryLevel,
            (msg: MessageOrType) => {
              const bat = msg as BatteryLevel;
              const val = {
                level: Math.round(100 * bat.level),
                isCharging: bat.charging,
                voltage: bat.voltage, // Voltage is always different
              };
              setValue(val as ValueType);
            },
            setLastError,
            forceUpdate
          );

        case "rssi":
          setValue(pixel.rssi as ValueType);
          return _requestProp(
            pixel,
            refreshInterval,
            "rssi",
            () => pixel.queryRssi(),
            (rssi) => setValue(rssi as ValueType),
            setLastError,
            forceUpdate
          );

        case "temperature":
          return _requestValue(
            pixel,
            refreshInterval,
            "temperature",
            MessageTypeValues.requestTemperature,
            (msg: MessageOrType) =>
              setValue(
                ((msg as Temperature).temperatureTimes100 / 100) as ValueType
              ),
            setLastError,
            forceUpdate
          );

        case "telemetry": {
          // Force updating on status change
          const onStatus = (status: PixelStatus) => {
            if (status === "ready" || status === "disconnected") {
              forceUpdate();
            }
          };
          pixel.addEventListener("status", onStatus);
          // Listen for telemetry messages
          const onTelemetry = (msg: MessageOrType) => {
            const value = msg as ValueType;
            stateRef.current.lastValue = value;
            // One we have an initial value, update with given interval
            if (!stateRef.current.timeoutId) {
              setValue(value);
              stateRef.current.timeoutId = setInterval(
                () => setValue(stateRef.current.lastValue),
                refreshInterval
              );
            }
          };
          pixel.addMessageListener("telemetry", onTelemetry);
          // Request for telemetry updates
          const msg = new RequestTelemetry();
          msg.activate = true;
          pixel.sendMessage(msg).catch(setLastError);
          return () => {
            // Cleanup
            clearInterval(stateRef.current.timeoutId);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            stateRef.current.timeoutId = undefined;
            pixel.removeEventListener("status", onStatus);
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
  }, [isActive, pixel, refreshInterval, status, valueName, waitOnStart]);

  // Create the dispatch function
  const dispatch = useCallback(
    (action: "start" | "stop") => setIsActive(action === "start"),
    []
  );
  const checkedValue =
    stateRef.current.lastValueName === valueName ? value : undefined;
  return [checkedValue, dispatch, lastError];
}

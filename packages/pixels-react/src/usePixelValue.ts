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

interface PixelValueMapping {
  roll: number;
  rollState: PixelRollData;
  battery: PixelBatteryData;
  batteryWithVoltage: PixelBatteryData & { voltage: number };
  rssi: number;
  temperature: number;
  telemetry: Telemetry;
}

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

// refreshInterval ignored for "roll" value
export default function <T extends keyof PixelValueMapping>(
  pixel?: Pixel,
  valueName?: T,
  options?: {
    refreshInterval?: number; // This is a maximum, default 1s
    waitOnStart?: boolean; // Default false
  }
): [
  PixelValueMapping[T] | undefined,
  (action: "start" | "stop") => void,
  Error?
] {
  type ValueType = PixelValueMapping[T];
  const [lastError, setLastError] = useState<Error>();
  const [value, setValue] = useState<ValueType>();
  const [isActive, setIsActive] = useState(false);
  const stateRef = useRef<{
    lastValueName?: keyof PixelValueMapping;
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
              const timeLeft =
                refreshInterval - (Date.now() - stateRef.current.lastTime);
              if (rollState.state === "onFace" || timeLeft <= 0) {
                stateRef.current.lastTime = now;
                clearTimeout(stateRef.current.timeoutId);
                stateRef.current.timeoutId = undefined;
                return rollState as ValueType;
              } else {
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

  const dispatch = useCallback(
    (action: "start" | "stop") => setIsActive(action === "start"),
    []
  );
  const checkedValue =
    stateRef.current.lastValueName === valueName ? value : undefined;
  return [checkedValue, dispatch, lastError];
}

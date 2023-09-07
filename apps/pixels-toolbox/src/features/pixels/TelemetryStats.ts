import { Telemetry } from "@systemic-games/react-native-pixels-connect";

interface TelemetryFrame {
  telemetry: Telemetry;
  accMagnitude: number;
}

function getAccMagnitude(telemetry: Telemetry) {
  const x = telemetry.accXTimes1000 / 1000;
  const y = telemetry.accYTimes1000 / 1000;
  const z = telemetry.accZTimes1000 / 1000;
  return Math.sqrt(x * x + y * y + z * z);
}

export default class TelemetryStats {
  private readonly _framesTimeSpan: number;
  private readonly _frames: TelemetryFrame[] = [];

  get lastAccMagnitude(): number {
    return this._frames[0]?.accMagnitude ?? 0;
  }

  get avgAccMagnitude(): number {
    if (!this._frames.length) {
      return 0;
    }
    return (
      this._frames.map((f) => f.accMagnitude).reduce((a, b) => a + b) /
      this._frames.length
    );
  }

  get minAccMagnitude(): number {
    if (!this._frames.length) {
      return 0;
    }
    return Math.min(...this._frames.map((f) => f.accMagnitude));
  }

  get maxAccMagnitude(): number {
    if (!this._frames.length) {
      return 0;
    }
    return Math.max(...this._frames.map((f) => f.accMagnitude));
  }

  constructor(framesTimeSpan = 5000) {
    this._framesTimeSpan = framesTimeSpan;
  }

  push(telemetry: Telemetry): void {
    // Remove old frames
    const tMin = telemetry.timeMs - this._framesTimeSpan;
    while (this._frames.length && this._frames[0].telemetry.timeMs < tMin) {
      this._frames.shift();
    }
    // Push new frame
    const accMagnitude = getAccMagnitude(telemetry);
    this._frames.push({
      telemetry,
      accMagnitude,
    });
  }
}

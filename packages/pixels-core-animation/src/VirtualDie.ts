import { DiceUtils } from "./DiceUtils";
import { PixelDieType } from "./PixelDieType";

export default class VirtualDie {
  private _currentFace = 0;
  private _lastRoll = 0;

  readonly dieType: PixelDieType;
  readonly ledCount: number;
  readonly faceCount: number;
  readonly topFace: number;

  get currentFace(): number {
    this.tryRoll();
    return this._currentFace;
  }

  constructor(dieType: PixelDieType = "d20") {
    this.dieType = dieType;
    this.ledCount = DiceUtils.getLEDCount(dieType);
    this.faceCount = DiceUtils.getFaceCount(dieType);
    this.topFace = DiceUtils.indexFromFace(
      DiceUtils.getTopFace(dieType),
      dieType
    );
    this.tryRoll();
  }

  tryRoll(): void {
    const now = Date.now();
    if (now - this._lastRoll > 5000) {
      this._lastRoll = now;
      this._currentFace = Math.floor(Math.random() * this.faceCount);
    }
  }
}

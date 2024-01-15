import { DieType } from "./DieType";
import { getLEDCount, getFaceCount, getTopFace } from "./faceUtils";

export default class VirtualDie {
  private _currentFace: number;

  readonly dieType: DieType;
  readonly ledCount: number;
  readonly faceCount: number;
  readonly topFace: number;

  get currentFace(): number {
    return this._currentFace;
  }

  constructor(dieType: DieType = "d20") {
    this.dieType = dieType;
    this._currentFace = 0;
    this.ledCount = getLEDCount(dieType);
    this.faceCount = getFaceCount(dieType);
    this.topFace = getTopFace(dieType);
  }

  setCurrentFace(face: number): void {
    this._currentFace = face;
  }
}

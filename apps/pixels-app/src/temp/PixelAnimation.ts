export class PixelAnimation {
  private _uuid: string;

  name: string;

  get uuid() {
    return this._uuid;
  }

  constructor(opt?: { uuid?: string; name?: string }) {
    this.name = opt?.name ?? "";
    this._uuid = opt?.uuid ?? Math.random().toString();
  }
}

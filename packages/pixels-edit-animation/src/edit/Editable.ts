import { name, observable, widget } from "./decorators";

/** Base class for classes used to create and edit animations. */
export default abstract class Editable {
  private _uuid: string;

  @widget("string")
  @name("Name")
  @observable
  name: string;

  get uuid() {
    return this._uuid;
  }

  constructor(opt?: { uuid?: string; name?: string }) {
    this.name = opt?.name ?? "";
    this._uuid = opt?.uuid ?? "";
  }

  abstract duplicate(uuid?: string): Editable;
}

import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditAudioClip extends Editable {
  @observable
  localId: number;

  constructor(opt?: { uuid?: string; name?: string; localId?: number }) {
    super(opt);
    this.localId = opt?.localId ?? 0;
  }
}

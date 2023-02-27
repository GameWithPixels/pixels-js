import Editable from "./Editable";

export default class EditAudioClip extends Editable {
  localId: number;

  constructor(opt?: { uuid?: string; name?: string; localId?: number }) {
    super(opt);
    this.localId = opt?.localId ?? 0;
  }
}

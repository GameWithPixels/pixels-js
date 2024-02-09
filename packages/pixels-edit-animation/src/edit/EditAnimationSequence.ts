import {
  AnimationBits,
  AnimationPreset,
  AnimationSequence,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation, { EditAnimationParams } from "./EditAnimation";
import EditAnimationSequenceItem from "./EditAnimationSequenceItem";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditAnimationSequence extends EditAnimation {
  readonly type = "sequence";

  @observable
  animations: EditAnimationSequenceItem[];

  constructor(
    opt?: EditAnimationParams & {
      animations?: EditAnimationSequenceItem[];
    }
  ) {
    super(opt);
    this.animations = opt?.animations ?? [];
  }

  toAnimation(editSet: EditDataSet, _: AnimationBits): AnimationPreset {
    const ret = new AnimationSequence();
    ret.animationCount = this.animations.length;
    if (ret.animationCount > 0) {
      ret.animation0Offset = editSet.animations.indexOf(
        this.animations[0].animation
      );
      ret.animation0Delay = this.animations[0].delay * 1000;
    }
    if (ret.animationCount > 1) {
      ret.animation1Offset = editSet.animations.indexOf(
        this.animations[1].animation
      );
      ret.animation1Delay = this.animations[1].delay * 1000;
    }
    if (ret.animationCount > 2) {
      ret.animation2Offset = editSet.animations.indexOf(
        this.animations[2].animation
      );
      ret.animation2Delay = this.animations[2].delay * 1000;
    }
    if (ret.animationCount > 3) {
      ret.animation3Offset = editSet.animations.indexOf(
        this.animations[3].animation
      );
      ret.animation3Delay = this.animations[3].delay * 1000;
    }

    safeAssign(ret, {
      animFlags: this.animFlags,
      duration: this.duration * 1000,
    });

    return ret;
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationSequence({
      ...this,
      uuid,
      animations: this.animations.map((a) => a.duplicate()),
    });
  }

  collectAnimations(): EditAnimation[] {
    return [this, ...this.animations.map((a) => a.animation)];
  }
}

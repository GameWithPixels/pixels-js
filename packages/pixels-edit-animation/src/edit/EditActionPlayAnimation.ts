import {
  DataSet,
  ActionType,
  ActionTypeValues,
  Action,
  ActionPlayAnimation,
  Constants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import { name, observable, range, widget } from "./decorators";

export default class EditActionPlayAnimation extends EditAction {
  @widget("animation")
  @name("Lighting Pattern")
  @observable
  animation?: EditAnimation;

  @widget("playbackFace")
  @name("Play On Face")
  @observable
  face: number; // Face value

  @widget("count")
  @range(1, 10)
  @name("Repeat Count")
  @observable
  loopCount: number;

  constructor(opt?: {
    animation?: EditAnimation;
    face?: number;
    loopCount?: number;
  }) {
    super();
    this.animation = opt?.animation;
    this.face = opt?.face ?? Constants.currentFaceIndex;
    this.loopCount = opt?.loopCount ?? 1;
  }

  get type(): ActionType {
    return ActionTypeValues.playAnimation;
  }

  toAction(editSet: EditDataSet, _set: DataSet, _actionId: number): Action {
    return safeAssign(new ActionPlayAnimation(), {
      animIndex: this.animation
        ? editSet.animations.indexOf(this.animation)
        : Constants.currentFaceIndex,
      faceIndex: this.face > 0 ? this.face - 1 : this.face,
      loopCount: this.loopCount,
    });
  }

  duplicate(): EditAction {
    return new EditActionPlayAnimation(this);
  }

  replaceAnimation(
    oldAnimation: EditAnimation,
    newAnimation: EditAnimation
  ): void {
    if (this.animation === oldAnimation) {
      this.animation = newAnimation;
    }
  }

  requiresAnimation(animation: EditAnimation): boolean {
    return this.animation === animation;
  }

  collectAnimations(): EditAnimation[] {
    return this.animation ? [this.animation] : [];
  }
}

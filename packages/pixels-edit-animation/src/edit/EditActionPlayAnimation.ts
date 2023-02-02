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
import { name, range, widget } from "./decorators";

export default class EditActionPlayAnimation extends EditAction {
  @widget("animation")
  @name("Lighting Pattern")
  animation?: EditAnimation;

  @widget("playbackFace")
  @name("Play on Face")
  faceIndex: number;

  @widget("count")
  @range(1, 10)
  @name("Repeat Count")
  loopCount: number;

  constructor(
    animation?: EditAnimation,
    faceIndex: number = Constants.currentFaceIndex,
    loopCount = 1
  ) {
    super();
    this.animation = animation;
    this.faceIndex = faceIndex;
    this.loopCount = loopCount;
  }

  get type(): ActionType {
    return ActionTypeValues.playAnimation;
  }

  toAction(editSet: EditDataSet, _set: DataSet): Action {
    return safeAssign(new ActionPlayAnimation(), {
      animIndex: this.animation
        ? editSet.animations.indexOf(this.animation)
        : Constants.currentFaceIndex,
      faceIndex: this.faceIndex,
      loopCount: this.loopCount,
    });
  }

  duplicate(): EditAction {
    return new EditActionPlayAnimation(
      this.animation,
      this.faceIndex,
      this.loopCount
    );
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

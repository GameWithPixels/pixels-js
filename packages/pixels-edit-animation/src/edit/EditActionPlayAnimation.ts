import {
  DataSet,
  Action,
  ActionPlayAnimation,
  Constants,
  Color,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import { name, observable, range, widget } from "./decorators";

export default class EditActionPlayAnimation extends EditAction {
  readonly type = "playAnimation";

  @widget("animation")
  @name("Animation")
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

  // TODO overrides

  @observable
  duration?: number;

  @observable
  fade?: number;

  @observable
  intensity?: number;

  @observable
  colors: Color[];

  constructor(opt?: {
    animation?: EditAnimation;
    face?: number;
    loopCount?: number;
    duration?: number;
    fade?: number;
    intensity?: number;
    colors?: Color[];
  }) {
    super();
    this.animation = opt?.animation;
    this.face = opt?.face ?? Constants.currentFaceIndex;
    this.loopCount = opt?.loopCount ?? 1;
    this.duration = opt?.duration;
    this.fade = opt?.fade;
    this.intensity = opt?.intensity;
    this.colors = opt?.colors ?? [];
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
    return new EditActionPlayAnimation({
      ...this,
      colors: this.colors.map((c) => c.duplicate()),
    });
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
    return this.animation ? this.animation.collectAnimations() : [];
  }
}

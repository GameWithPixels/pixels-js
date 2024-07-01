import EditAnimation from "./EditAnimation";
import { observable } from "./decorators";

export default class EditAnimationSequenceItem {
  @observable
  animation: EditAnimation;

  @observable
  delay: number;

  constructor(animation: EditAnimation, delay?: number) {
    this.animation = animation;
    this.delay = delay ?? 0;
  }

  duplicate(): EditAnimationSequenceItem {
    return new EditAnimationSequenceItem(
      this.animation.duplicate(),
      this.delay
    );
  }
}

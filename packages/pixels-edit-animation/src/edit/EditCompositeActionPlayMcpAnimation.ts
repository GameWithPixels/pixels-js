import EditCompositeAction from "./EditCompositeAction";
import { observable } from "./decorators";

export default class EditCompositeActionPlayMcpAnimation extends EditCompositeAction {
  readonly type = "playMcpAnimation";

  @observable
  animation?: number;

  constructor(opt?: { animation?: number }) {
    super();
    this.animation = opt?.animation;
  }

  duplicate(): EditCompositeAction {
    return new EditCompositeActionPlayMcpAnimation({
      ...this,
    });
  }
}

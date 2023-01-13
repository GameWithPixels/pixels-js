import {
  AnimationBits,
  AnimationPreset,
  AnimationType,
  AnimationTypeValues,
  FaceCompareFlags,
  FaceCompareFlagsValues,
} from "@systemic-games/pixels-core-animation";
import {
  decorators,
  EditAnimation,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";

export default class EditAnimationSandbox extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.rainbow;
  }

  @decorators.widget("bitField")
  @decorators.name("Comparison")
  @decorators.values(FaceCompareFlagsValues)
  flags: FaceCompareFlags;

  @decorators.widget("faceIndex")
  @decorators.range(0, 19)
  @decorators.name("Than")
  faceIndex: number;

  @decorators.widget("playbackFace")
  @decorators.name("Play on Face")
  playbackFace: number;

  constructor(options?: { name?: string; duration?: number }) {
    super(options?.name, options?.duration ?? 1);
    this.flags = FaceCompareFlagsValues.less | FaceCompareFlagsValues.equal;
    this.faceIndex = 3;
    this.playbackFace = -1; // -1 == current face
  }

  toAnimation(_editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    throw new Error("Not implemented");
  }

  duplicate(): EditAnimation {
    throw new Error("Not implemented");
  }
}

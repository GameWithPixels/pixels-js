import { serializable } from "@systemic-games/pixels-core-utils";

import { BufferDescriptor } from "./profileBuffer";

export class AnimationContextGlobals {
  @serializable(1)
  currentFace = 0;
  @serializable(2)
  normalizedFace = 0;
}
export class ParameterOverride {
  @serializable(2)
  index = 0; // Index in static buffer
  @serializable(2)
  overrideIndex = 0; // Index in override buffer
}

export class AnimationContext {
  globals = new AnimationContextGlobals();

  // Typically the profile programmed in flash memory
  buffer = new BufferDescriptor();

  // Typically ALSO the profile programmed in flash memory, but could be
  // a chunk in RAM if for instance an animation programmed in flash is triggered
  // with overrides from a bluetooth message.
  overrideBuffer = new BufferDescriptor();
  overrides: ParameterOverride[] = [];
}

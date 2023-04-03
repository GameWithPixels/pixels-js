import {
  assert,
  align32bits,
  byteSizeOf,
  bernsteinHash,
  serialize,
} from "@systemic-games/pixels-core-utils";

import AnimationBits from "./animations/AnimationBits";
import AnimationPreset from "./animations/AnimationPreset";
import Action from "./profiles/Action";
import Condition from "./profiles/Condition";
import Profile from "./profiles/Profile";
import Rule from "./profiles/Rule";

/**
 * Data Set is the set of a profile, conditions, rules, animations and colors
 * stored in the memory of a Pixels die. This data gets transferred straight to the dice.
 * For that purpose, the data is essentially 'exploded' into flat buffers. i.e. all
 * the key-frames of all the animations are stored in a single key-frame array, and
 * individual tracks reference 'their' key-frames using an offset and count into that array.
 * @category Profile
 */
export default class DataSet {
  private readonly _animationBits: AnimationBits;
  private readonly _animations: AnimationPreset[] = [];
  private readonly _conditions: Condition[] = [];
  private readonly _actions: Action[] = [];
  private readonly _rules: Rule[] = [];
  private _profile = new Profile();

  get animationBits(): AnimationBits {
    return this._animationBits;
  }

  get animations(): AnimationPreset[] {
    return this._animations;
  }

  get conditions(): Condition[] {
    return this._conditions;
  }

  get actions(): Action[] {
    return this._actions;
  }

  get rules(): Rule[] {
    return this._rules;
  }

  get profile(): Profile {
    return this._profile;
  }
  set profile(value: Profile) {
    this._profile = value;
  }

  constructor(bits?: AnimationBits) {
    this._animationBits = bits ?? new AnimationBits();
  }

  computeDataSetByteSize(): number {
    //TODO what if some array of size 0?
    return (
      this._animationBits.computeDataSize() +
      align32bits(this._animations.length * 2) + // offsets are 16 bits
      byteSizeOf(this._animations) + // animations data
      align32bits(this._conditions.length * 2) + // offsets are 16 bits
      byteSizeOf(this._conditions) + // conditions data
      align32bits(this._actions.length * 2) + // offsets are 16 bits
      byteSizeOf(this._actions) + // actions data
      byteSizeOf(this._rules) +
      (this._profile ? byteSizeOf(this._profile) : 0)
    );
  }

  toSingleAnimationByteArray(): Uint8Array {
    assert(this._animations.length === 1, "Need exactly one animation");
    assert(
      this._animationBits.palette.length <= 127,
      "Palette has more than 127 colors: " + this._animationBits.palette.length
    );

    // Compute size of animation bits + animation
    const size =
      this._animationBits.computeDataSize() + byteSizeOf(this._animations[0]);

    // Copy animation bits
    const [dataView, byteOffset] = this._animationBits.serialize(
      new DataView(new ArrayBuffer(size))
    );

    // Copy animation
    serialize(this._animations[0], { dataView, byteOffset });

    return new Uint8Array(dataView.buffer);
  }

  toAnimationsByteArray(): Uint8Array {
    assert(this._animations.length > 0, "No animations");
    assert(
      this._animationBits.palette.length <= 127,
      "Palette has more than 127 colors: " + this._animationBits.palette.length
    );

    // Compute size of animation bits + animations
    const size =
      this._animationBits.computeDataSize() +
      align32bits(this._animations.length * 2) + // offsets are 16 bits
      byteSizeOf(this._animations); // animations data

    // Copy animation bits
    let [dataView, byteOffset] = this._animationBits.serialize(
      new DataView(new ArrayBuffer(size))
    );

    // Copy animations, offsets first
    let animOffset = 0;
    this._animations.forEach((anim, i) => {
      dataView.setUint16(byteOffset + 2 * i, animOffset, true);
      animOffset += byteSizeOf(anim);
    });

    // Round up to nearest multiple of 4
    byteOffset += align32bits(this._animations.length * 2);

    // Then animations
    [dataView, byteOffset] = serialize(this._animations, {
      dataView,
      byteOffset,
    });

    return new Uint8Array(dataView.buffer);
  }

  toByteArray(): Uint8Array {
    const size = this.computeDataSetByteSize();
    const [dataView] = this.serialize(new DataView(new ArrayBuffer(size)));
    return new Uint8Array(dataView.buffer);
  }

  serialize(dataView: DataView, byteOffset = 0): [DataView, number] {
    assert(
      this._animationBits.palette.length <= 127,
      "Palette has more than 127 colors: " + this._animationBits.palette.length
    );

    // Copy animation bits
    [dataView, byteOffset] = this._animationBits.serialize(dataView);

    // Copy animations, offsets first
    let animOffset = 0;
    //TODO what if there are 0 animations?
    this._animations.forEach((anim, i) => {
      //TODO first index is always 0!
      dataView.setUint16(byteOffset + 2 * i, animOffset, true);
      animOffset += byteSizeOf(anim);
    });

    // Round up to nearest multiple of 4
    byteOffset += align32bits(this._animations.length * 2);

    // Then animations
    [dataView, byteOffset] = serialize(this._animations, {
      dataView,
      byteOffset,
    });

    // Copy conditions, offsets first
    let condOffset = 0;
    this._conditions.forEach((cond, i) => {
      dataView.setUint16(byteOffset + 2 * i, condOffset, true);
      condOffset += byteSizeOf(cond);
    });

    //TODO Alignment is not needed (and no alignment is done
    // in toSingleAnimationByteArray())
    // Round up to nearest multiple of 4
    byteOffset += align32bits(this._conditions.length * 2);

    // Then conditions
    [dataView, byteOffset] = serialize(this._conditions, {
      dataView,
      byteOffset,
    });

    // Copy actions, offsets first
    let actOffset = 0;
    this._actions.forEach((act, i) => {
      dataView.setUint16(byteOffset + 2 * i, actOffset, true);
      actOffset += byteSizeOf(act);
    });

    // Round up to nearest multiple of 4
    byteOffset += align32bits(this._actions.length * 2);

    // Then actions
    [dataView, byteOffset] = serialize(this._actions, { dataView, byteOffset });

    // Rules
    [dataView, byteOffset] = serialize(this._rules, { dataView, byteOffset });

    // Profile
    if (this._profile) {
      //TODO what if no profile?
      [dataView, byteOffset] = serialize(this._profile, {
        dataView,
        byteOffset,
      });
    }

    return [dataView, byteOffset];
  }

  static computeHash(bytes: Uint8Array): number {
    return bernsteinHash(bytes);
  }
}

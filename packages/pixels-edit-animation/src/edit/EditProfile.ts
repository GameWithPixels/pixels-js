import {
  ActionType,
  DataSet,
  PixelColorway,
  PixelDieType,
  Profile,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRule from "./EditRule";
import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditProfile extends Editable {
  @observable
  description: string;

  @observable
  rules: EditRule[];

  @observable
  dieType: PixelDieType;

  @observable
  colorway: PixelColorway;

  @observable
  brightness: number;

  // TODO The properties below should be moved to a separate class

  @observable
  creationDate: Date;

  @observable
  lastModified: Date;

  @observable
  lastUsed?: Date;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    description?: string;
    rules?: EditRule[];
    dieType?: PixelDieType;
    colorway?: PixelColorway;
    brightness?: number;
    creationDate?: Date;
    lastModified?: Date;
    lastUsed?: Date;
  }) {
    super(opt);
    this.description = opt?.description ?? "";
    this.rules = opt?.rules ?? [];
    this.dieType = opt?.dieType ?? "d20";
    this.colorway = opt?.colorway ?? "onyxBlack";
    this.brightness = opt?.brightness ?? 1;
    this.creationDate = opt?.creationDate ?? new Date();
    this.lastModified = opt?.lastModified ?? new Date();
    this.lastUsed = opt?.lastUsed;
  }

  getRemoteAction(actionId: number): EditActionRunOnDevice | undefined {
    const ruleId = actionId >> 8;
    const action = this.rules[ruleId]?.actions[actionId & 0xff];
    return action instanceof EditActionRunOnDevice ? action : undefined;
  }

  toProfile(editSet: EditDataSet, set: DataSet): Profile {
    // Add our rules to the set
    const rulesOffset = set.rules.length;
    this.rules.forEach((editRule, i) =>
      set.rules.push(editRule.toRule(editSet, set, i))
    );

    const rulesCount = this.rules.length;
    return safeAssign(new Profile(), {
      rulesOffset,
      rulesCount,
    });
  }

  duplicate(uuid?: string): EditProfile {
    const now = new Date();
    return new EditProfile({
      ...this,
      uuid,
      rules: this.rules.map((r) => r.duplicate()),
      creationDate: now,
      lastModified: now,
      lastUsed: undefined,
    });
  }

  collectAnimations(): EditAnimation[] {
    const animations: EditAnimation[] = [];
    for (const r of this.rules) {
      for (const action of r.actions) {
        for (const anim of action.collectAnimations()) {
          if (!animations.includes(anim)) {
            animations.push(anim);
          }
        }
      }
    }
    return animations;
  }

  hasActionOfType(type: ActionType): boolean {
    return this.rules.some((r) => r.actions.some((a) => a.type === type));
  }
}

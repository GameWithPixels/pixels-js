import EditAnimation from "./EditAnimation";
import EditCompositeRule from "./EditCompositeRule";
import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditCompositeProfile extends Editable {
  @observable
  description: string;

  @observable
  formula?: string;

  @observable
  rules: EditCompositeRule[];

  @observable
  speakResult: boolean;

  @observable
  resultAnimation?: EditAnimation;

  // TODO The properties below should be moved to a separate class

  @observable
  creationDate: Date;

  @observable
  lastModified: Date;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    description?: string;
    formula?: string;
    resultAnimation?: EditAnimation;
    rules?: EditCompositeRule[];
    speakResult?: boolean;
    creationDate?: Date;
    lastModified?: Date;
  }) {
    super(opt);
    this.description = opt?.description ?? "";
    this.formula = opt?.formula;
    this.resultAnimation = opt?.resultAnimation;
    this.rules = opt?.rules ?? [];
    this.speakResult = opt?.speakResult ?? false;
    this.creationDate = opt?.creationDate ?? new Date();
    this.lastModified = opt?.lastModified ?? new Date();
  }

  duplicate(uuid?: string): EditCompositeProfile {
    const now = new Date();
    return new EditCompositeProfile({
      ...this,
      uuid,
      rules: this.rules.map((r) => r.duplicate()),
      creationDate: now,
      lastModified: now,
    });
  }
}

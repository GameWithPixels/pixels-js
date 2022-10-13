import { serializable } from "@systemic-games/pixels-core-utils";

export default class Profile {
  @serializable(2)
  rulesOffset = 0;

  @serializable(2)
  rulesCount = 0;
}

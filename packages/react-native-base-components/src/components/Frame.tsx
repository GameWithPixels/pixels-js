import { BaseBoxProps } from "./BaseBox";
import { RoundedBox } from "./RoundedBox";

export interface FrameProps extends BaseBoxProps {}

export function Frame(props: FrameProps) {
  return <RoundedBox fill border alignItems="center" gap={5} {...props} />;
}

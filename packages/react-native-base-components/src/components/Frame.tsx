import { FastBoxProps, RoundedBox } from "./FastBox";

export interface FrameProps extends FastBoxProps {}

export function Frame(props: FrameProps) {
  return <RoundedBox fill border alignItems="center" gap={5} {...props} />;
}

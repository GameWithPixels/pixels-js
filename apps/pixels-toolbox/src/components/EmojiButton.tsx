import { IButtonProps, Button } from "native-base";

export default function (props: IButtonProps) {
  return <Button size="lg" _text={textStyle} px={6} py={3} {...props} />;
}

const textStyle = { fontSize: "2xl" };

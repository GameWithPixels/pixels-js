import { IButtonProps, Button } from "native-base";

export default function (props: IButtonProps) {
  return (
    <Button
      size="xs"
      _text={{ fontSize: "xl" }}
      p="1%"
      variant="emoji"
      {...props}
    />
  );
}

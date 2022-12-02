import { IButtonProps, Button } from "native-base";

import { sr } from "~/styles";

export default function (props: IButtonProps) {
  return (
    <Button
      size="lg"
      _text={{ fontSize: "2xl" }}
      px={sr(6)}
      py={sr(3)}
      {...props}
    />
  );
}

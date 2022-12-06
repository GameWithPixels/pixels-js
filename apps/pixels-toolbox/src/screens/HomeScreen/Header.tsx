import { Center, HStack, Text } from "native-base";
import { memo } from "react";

import Menu from "./Menu";

import { sr } from "~/styles";

function HeaderImpl({ title }: { title: string }) {
  return (
    <HStack width="100%" height="100%" alignItems="center">
      <Center position="absolute" top={0} width={sr(40)} height={sr(40)}>
        <Menu />
      </Center>
      <Center width="100%" height="100%">
        <Text variant="h2">{title}</Text>
      </Center>
    </HStack>
  );
}

export default memo(HeaderImpl);

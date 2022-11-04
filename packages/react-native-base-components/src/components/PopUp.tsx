import {
  Center,
  VStack,
  Modal,
  Text,
  IModalProps,
  usePropsResolution,
  Button,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React, { ReactNode } from "react";

export interface PopUpProps extends IModalProps {
  title?: string;
  footerChildren?: ReactNode | ReactNode[];
  bg?: ColorType;
  closeButtonTitle?: string;
  isOpen?: boolean;
}

export function PopUp(props: PopUpProps) {
  const resolvedProps = usePropsResolution("PopUp", props);
  const [showPopUp, SetShowPopUp] = React.useState(resolvedProps.isOpen);
  return (
    <>
      {/* popUp window */}
      <Modal {...resolvedProps} isOpen={showPopUp}>
        <Modal.Content
          bg={resolvedProps.bg}
          borderColor={resolvedProps.borderColor}
          borderWidth={resolvedProps.borderWidth}
        >
          <Modal.Header bg={resolvedProps.bg}>
            <Center>
              <Text>{resolvedProps.title}</Text>
            </Center>
          </Modal.Header>
          <Modal.Body>
            <VStack space={2}>{resolvedProps.children}</VStack>
          </Modal.Body>
          <Modal.Footer bg={resolvedProps.bg}>
            {resolvedProps.footerChildren}
          </Modal.Footer>
          <Button onPress={() => SetShowPopUp(false)}>
            <Text>Close</Text>
          </Button>
        </Modal.Content>
      </Modal>
    </>
  );
}

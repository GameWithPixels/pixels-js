import {
  Center,
  VStack,
  Modal,
  Text,
  IModalProps,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React, { ReactNode } from "react";

export interface popUpProps extends IModalProps {
  header?: string;
  children?: ReactNode | ReactNode[];
  footerChildren?: ReactNode | ReactNode[];
  trigger: JSX.Element;
  bg?: ColorType;
  closeButtonTitle?: string;
  isOpen?: boolean;
}

export function PopUpModal(props: popUpProps) {
  const resolvedProps = usePropsResolution("BasePopUp", props);
  const showPopUp = resolvedProps.isOpen;
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
              <Text>{resolvedProps.header}</Text>
            </Center>
          </Modal.Header>
          <Modal.Body>
            <VStack space={2}>{resolvedProps.children}</VStack>
          </Modal.Body>
          <Modal.Footer bg={resolvedProps.bg}>
            {resolvedProps.footerChildren}
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}

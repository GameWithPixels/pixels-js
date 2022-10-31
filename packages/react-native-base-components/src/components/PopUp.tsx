import {
  Center,
  VStack,
  Modal,
  Button,
  Pressable,
  Text,
  IModalProps,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

export interface popUpProps extends IModalProps {
  header?: string;
  children?: JSX.Element | JSX.Element[];
  footerChildren?: JSX.Element | JSX.Element[];
  trigger: JSX.Element;
  bg?: ColorType;
  closeButtonTitle?: string;
}

export function PopUpModal(props: popUpProps) {
  const [ShowPopUp, SetShowPopUp] = React.useState(false);
  const resolvedProps = usePropsResolution("BasePopUp", props);
  return (
    <>
      {/* component that will open the popUp window */}
      <Pressable onPress={() => SetShowPopUp(true)}>
        {resolvedProps.trigger}
      </Pressable>

      {/* popUp window */}
      <Modal isOpen={ShowPopUp}>
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
            <Button onPress={() => SetShowPopUp(false)}>
              <Text>{resolvedProps.closeButtonTitle}</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}

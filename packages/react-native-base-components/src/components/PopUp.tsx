import {
  Center,
  VStack,
  Modal,
  Text,
  IModalProps,
  usePropsResolution,
  Button,
  HStack,
} from "native-base";
import React from "react";

export interface PopUpProps extends IModalProps {
  title?: string;
  buttons?: string | string[];
  onClose?: (result?: string) => void;
}

export function PopUp({ title, buttons, onClose, ...props }: PopUpProps) {
  const resolvedProps = usePropsResolution("PopUp", props) as PopUpProps;
  // const { isOpen, onOpen, onClose } = useDisclose(resolvedProps.isOpen);
  return (
    <>
      {/* popUp window */}
      <Modal isOpen={props.isOpen}>
        <Modal.Content
          w={resolvedProps.w}
          bg={resolvedProps.bg}
          borderColor={resolvedProps.borderColor}
          borderWidth={resolvedProps.borderWidth}
          // {...resolvedProps}
        >
          <Modal.Header bg={resolvedProps.bg}>
            <Center>
              <Text bold fontSize="md">
                {title}
              </Text>
            </Center>
          </Modal.Header>
          <Modal.Body>
            <VStack space={2}>{resolvedProps.children}</VStack>
          </Modal.Body>
          <Modal.Footer bg={resolvedProps.bg}>
            <HStack w="100%" space={2}>
              {!buttons || typeof buttons === "string" ? (
                <Button
                  flex={1}
                  onPress={() => {
                    onClose?.(buttons);
                  }}
                >
                  <Text>{`${buttons ?? "Close"}`}</Text>
                </Button>
              ) : (
                buttons.map((title, i) => (
                  <Button flex={1} key={i} onPress={() => onClose?.(title)}>
                    {title}
                  </Button>
                ))
              )}
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}

import {
  Center,
  VStack,
  Modal,
  Text,
  usePropsResolution,
  Button,
  HStack,
} from "native-base";
import React from "react";

// export interface PopUpProps extends IModalProps {
//   title?: string;
//   buttons?: string | string[];
//   onClose?: (result?: string) => void;
// }

export interface PopupProps<T extends string> {
  title: string;
  buttons?: Map<T, string> | T;
  onClose?: (result: T) => void;
  isOpen?: boolean;
}

export function PopUp<T extends string>({
  title,
  buttons,
  onClose,
  ...props
}: PopupProps<T>) {
  const resolvedProps = usePropsResolution("PopUp", props);
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
              {/* {!buttons || typeof buttons === "string" ? (
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
              )} */}
              {!buttons ? (
                <Button onPress={() => onClose?.("Close" as T)}>Close</Button>
              ) : typeof buttons === "string" ? (
                <Button onPress={() => onClose?.(buttons)}>{buttons}</Button>
              ) : (
                Array.from(buttons).map(([id, label]) => (
                  <Button onPress={() => onClose?.(id)}>{label}</Button>
                ))
              )}
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}

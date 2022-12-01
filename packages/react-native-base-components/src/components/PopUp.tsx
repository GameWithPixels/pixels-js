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

/**
 * Props for {@link PopUp} component.
 */
export interface PopupProps<T extends string> {
  title: string; // popup title
  buttons?: Map<T, string> | T; // list of buttons titles that will be used inside the popup to generate a corresponding button for each given title
  onClose?: (result: T) => void; // function called by each generated button returning the button title that executed it. Result should be used outside of the popup to do different things based on the returned button
  isOpen?: boolean; // if the popup is open or closed. Used to control popup from outside
}
/**
 * A popup to display any children, with a set of footer buttons generated depending on given buttons titles.
 * @param props See {@link PopupProps} for props parameters.
 */
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

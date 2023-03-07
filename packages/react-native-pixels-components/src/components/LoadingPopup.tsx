import { ProgressBar } from "@systemic-games/react-native-base-components";
import { Center, Modal, Text } from "native-base";
import React from "react";

/**
 * Props for loading popup component
 */
export interface LoadingPopupProps {
  title?: string;
  progress?: number; // current loading progress value
  isOpen?: boolean; // if the pop up is open(shown) or closed. Used to control the popup from outside
}
/**
 * A loading popup box that display a title and loading progress bar.
 * @param props See {@link LoadingPopupProps} for props parameters.
 */
export function LoadingPopup(props: LoadingPopupProps) {
  return (
    <Modal isOpen={props.isOpen}>
      <Modal.Content>
        <Modal.Header>
          <Center>
            <Text>{props.title}</Text>
          </Center>
        </Modal.Header>
        <Modal.Body minH={1}>
          <ProgressBar progress={props.progress} />
        </Modal.Body>
        <Modal.Footer />
      </Modal.Content>
    </Modal>
  );
}

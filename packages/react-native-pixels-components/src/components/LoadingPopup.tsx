import { ProgressBar } from "@systemic-games/react-native-base-components";
import { Center, IModalProps, Modal, Text } from "native-base";
import React from "react";

/**
 * Props for loading popup component
 */
export interface LoadingPopupProps extends IModalProps {
  title?: string;
  progress?: number; // current loading progress value
}

/**
 * A loading popup box that display a title and loading progress bar.
 * @param props See {@link LoadingPopupProps} for props parameters.
 */
export function LoadingPopup({ title, progress, ...props }: LoadingPopupProps) {
  return (
    <Modal {...props}>
      <Modal.Content>
        <Modal.Header>
          <Center>
            <Text>{title}</Text>
          </Center>
        </Modal.Header>
        <Modal.Body minH={1}>
          <ProgressBar progress={progress} />
        </Modal.Body>
        <Modal.Footer />
      </Modal.Content>
    </Modal>
  );
}

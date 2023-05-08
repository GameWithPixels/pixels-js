import React from "react";
import {
  Card,
  Modal,
  Portal,
  ModalProps,
  ProgressBar,
} from "react-native-paper";

import { useModalStyle } from "../theme";

/**
 * Props for loading popup component
 */
export interface LoadingPopupProps extends Omit<ModalProps, "children"> {
  title?: string;
  progress?: number; // current loading progress value
}

/**
 * A loading popup box that display a title and loading progress bar.
 * @param props See {@link LoadingPopupProps} for props parameters.
 */
export function LoadingPopup({ title, progress, ...props }: LoadingPopupProps) {
  const modalStyle = useModalStyle();
  return (
    <Portal>
      <Modal contentContainerStyle={modalStyle} {...props}>
        <Card>
          <Card.Title title={title} />
          <Card.Content>
            <ProgressBar progress={progress} />
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

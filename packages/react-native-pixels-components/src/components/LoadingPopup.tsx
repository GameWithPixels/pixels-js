import { ProgressBar } from "@systemic-games/react-native-base-components";
import { Center, HStack, Modal, Text } from "native-base";
import React from "react";

//TODO remove minh minw

/**
 * Props for loading popup component
 */
export interface LoadingPopupProps {
  title?: string;
  progress?: number; // current loading progress value
  isOpen?: boolean; // if the pop up is open(shown) or closed. Used to control the popup from outside
  onProgressEnd?: (() => void) | null | undefined; // function to be executed when the progress value ends/loading is over : tells that popup can be closed from outside
}
/**
 * A loading popup box that display a title and loading progress bar.
 * @param props See {@link LoadingPopupProps} for props parameters.
 */
export function LoadingPopup(props: LoadingPopupProps) {
  const [progress, setProgress] = React.useState(0);

  // Use to  currently fake the loading progress and closing of the popup
  React.useEffect(() => {
    if (progress <= 100 && props.isOpen) {
      const timeoutId = setTimeout(() => setProgress(progress + 2), 0.05);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setProgress(0);
    }
    props.onProgressEnd?.();
  }, [progress, props]);

  return (
    <Modal isOpen={props.isOpen}>
      <Modal.Content>
        <Modal.Header>
          <Center>
            <HStack space={2}>
              <Text>{props.title}</Text>
            </HStack>
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

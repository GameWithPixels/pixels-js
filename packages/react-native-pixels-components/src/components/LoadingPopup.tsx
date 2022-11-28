import { ProgressBar } from "@systemic-games/react-native-base-components";
import { Center, HStack, Modal, Text } from "native-base";
import React from "react";

export interface LoadingPopupProps {
  title?: string;
  progress?: number;
  isOpen?: boolean;
  onProgressEnd?: (() => void) | null | undefined;
}

export function LoadingPopup(props: LoadingPopupProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (progress < 100 && props.isOpen) {
      const timeoutId = setTimeout(() => setProgress(progress + 2), 0.05);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    setProgress(0);
    props.onProgressEnd?.();
  }, [progress, props]);

  return (
    <Modal isOpen={props.isOpen}>
      <Modal.Content>
        <Modal.Header>
          <Center>
            <HStack space={2}>
              <Text>{props.title}</Text>
              {/* <Spinner size="sm" color="amber.500" /> */}
            </HStack>
          </Center>
        </Modal.Header>
        <Modal.Body minH="1px">
          <ProgressBar progress={progress} />
        </Modal.Body>
        <Modal.Footer />
      </Modal.Content>
    </Modal>
  );
}

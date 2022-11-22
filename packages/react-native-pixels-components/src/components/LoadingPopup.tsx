import { ProgressBar } from "@systemic-games/react-native-base-components";
import { Center, HStack, Modal, Spinner, Text } from "native-base";

export interface LoadingPopupProps {
  title?: string;
  progress?: number;
  isOpen?: boolean;
  onProgressEnd?: (() => void) | null | undefined;
}

export function LoadingPopup(props: LoadingPopupProps) {
  //   useEffect(() => {
  //     const timer = setTimeout(() => {
  //       console.log("closed");
  //       props.onProgressEnd?.();
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   });

  return (
    <Modal isOpen={props.isOpen}>
      <Modal.Content>
        <Modal.Header>
          <Center>
            <HStack space={2}>
              <Text>{props.title}</Text>
              <Spinner size="sm" color="amber.500" />
            </HStack>
          </Center>
        </Modal.Header>
        <Modal.Body>
          <ProgressBar progress={props.progress} />
        </Modal.Body>
        <Modal.Footer />
      </Modal.Content>
    </Modal>
  );
}

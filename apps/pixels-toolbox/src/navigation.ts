import { StackScreenProps } from "@react-navigation/stack";

export type RootStackParamList = {
  Menu: undefined;
  Connect: undefined;
  SelectDfuFile: undefined;
  Dfu: DfuScreenParams;
  Animations: undefined;
  Validation: undefined;
  Stats: undefined;
  Roll: undefined;
};

export type DfuScreenParams = {
  dfuFilePath: string;
};

export type DfuScreenProps = StackScreenProps<RootStackParamList, "Dfu">;

import { StackScreenProps } from "@react-navigation/stack";

export type RootStackParamList = {
  Home: undefined;
  SelectDfuFile: SelectDfuFileScreenParams;
  Validation: undefined;
  Stats: undefined;
  Roll: undefined;
};

export type SelectDfuFileScreenParams = {
  onDfuFileSelected: (path: string) => void;
};

export type SelectDfuFileScreenProps = StackScreenProps<
  RootStackParamList,
  "SelectDfuFile"
>;

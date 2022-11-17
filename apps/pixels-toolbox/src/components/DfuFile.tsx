// eslint-disable-next-line import/namespace
import { Text, StyleSheet } from "react-native";

import Spacer from "./Spacer";

import { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import globalStyles from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface DfuFileProps {
  fileInfo: DfuFileInfo;
}

// Display the DFU file info
export default function ({ fileInfo }: DfuFileProps) {
  const dfuFileDateStr = fileInfo.date
    ? toLocaleDateTimeString(fileInfo.date)
    : "unspecified";
  return (
    <>
      <Text style={styles.textBold}>{`Date: ${dfuFileDateStr}`}</Text>
      <Spacer />
      {fileInfo.type ? (
        <Text style={styles.text}>{`DFU file type: ${fileInfo.type}`}</Text>
      ) : (
        <Text style={styles.textBoldRed}>/!\ Unknown DFU file type</Text>
      )}
      <Text style={styles.text} ellipsizeMode="head" numberOfLines={1}>
        {fileInfo.pathname ?? "no file"}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
});

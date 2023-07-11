import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // One prop styles
  empty: {},
  flex: {
    flex: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  fullWidth: {
    width: "100%",
  },
  selfCentered: {
    alignSelf: "center",
  },
  // Containers
  fullSize: {
    width: "100%",
    height: "100%",
  },
  fullSizeFlex: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredFlex: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Text
  textCentered: {
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underlined: {
    textDecorationLine: "underline",
  },
});

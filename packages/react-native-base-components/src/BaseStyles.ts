import { StyleSheet } from "react-native";

export default StyleSheet.create({
  flex: {
    flex: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  fullWidth: {
    width: "100%",
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  fullSizeFlex: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  selfCentered: {
    alignSelf: "center",
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
  textCentered: {
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
});

import { StyleSheet } from "react-native";

// Global style
const gs = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  containerHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerFooter: {
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  text: {
    fontSize: 18,
  },
  textBold: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textBoldRed: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
  },
  textItalic: {
    fontSize: 18,
    fontStyle: "italic",
  },
  box: {
    backgroundColor: "lightgrey",
    borderRadius: 10,
    paddingVertical: "2%",
    paddingHorizontal: "4%",
  },
});

export default gs;

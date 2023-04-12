import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  containerHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerFullWidth: {
    width: "100%",
  },
  containerFooter: {
    alignItems: "center",
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

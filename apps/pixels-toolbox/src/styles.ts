import { StyleSheet } from "react-native";

// Global style
const gs = StyleSheet.create({
  // One prop styles
  empty: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  mv3: {
    marginVertical: 3,
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
  // Containers
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
  listContentContainer: {
    flexGrow: 1,
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default gs;

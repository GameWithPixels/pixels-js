import { extendTheme } from "native-base";

function viewVariants() {
  return {
    background: {
      _dark: {
        backgroundColor: "warmGray.800",
      },
      _light: {
        backgroundColor: "coolGray.100",
      },
    },
    card: {
      _dark: {
        backgroundColor: "coolGray.800",
      },
      _light: {
        backgroundColor: "warmGray.100",
      },
    },
    cardWithBorder: {
      borderRadius: "xl",
      borderWidth: "1",
      _dark: {
        backgroundColor: "coolGray.800",
        borderColor: "warmGray.500",
      },
      _light: {
        backgroundColor: "warmGray.100",
        borderColor: "coolGray.400",
      },
    },
  };
}

const theme = extendTheme({
  components: {
    Box: {
      variants: viewVariants(),
    },
    Center: {
      variants: viewVariants(),
    },
    VStack: {
      variants: viewVariants(),
    },
    HStack: {
      variants: viewVariants(),
    },
    Text: {
      baseStyle: {
        fontSize: "lg",
        _dark: {
          color: "warmGray.200",
        },
        _light: {
          color: "coolGray.700",
        },
      },
      variants: {
        h0: {
          fontSize: "4xl",
          bold: true,
        },
        h1: {
          fontSize: "3xl",
          bold: true,
        },
        h2: {
          fontSize: "2xl",
          bold: true,
        },
        h3: {
          fontSize: "xl",
          bold: true,
        },
      },
    },
    Button: {
      baseStyle: {
        size: "xs",
        _text: {
          fontSize: "lg",
        },
      },
      variants: {
        solid: {
          _dark: {
            bg: "coolGray.600",
            _pressed: {
              bg: "coolGray.700",
            },
            _text: {
              color: "warmGray.200",
            },
          },
          _light: {
            bg: "warmGray.300",
            _pressed: {
              bg: "warmGray.200",
            },
            _text: {
              color: "coolGray.700",
            },
          },
        },
      },
    },
  },
  config: {
    initialColorMode: "dark",
  },
});

export default theme;

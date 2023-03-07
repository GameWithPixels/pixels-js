const sizes = {
  sm: {
    _icon: {
      size: "sm",
    },
    _text: {
      fontSize: "sm",
    },
  },
  md: {
    _icon: {
      size: "md",
    },
    _text: {
      fontSize: "md",
    },
  },
  lg: {
    _icon: {
      size: "lg",
    },
    _text: {
      fontSize: "lg",
    },
  },
  xl: {
    _icon: {
      size: "xl",
    },
    _text: {
      fontSize: "xl",
    },
  },
  "2xl": {
    _icon: {
      size: "2xl",
    },
    _text: {
      fontSize: "2xl",
    },
  },
};

export default {
  defaultProps: {
    //colors to display from min to max as required by PercentageDisplay
    colors: ["red.500", "orange.500", "green.500"],
  },
  sizes,
};

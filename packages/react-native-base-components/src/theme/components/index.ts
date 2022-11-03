import BaseActionSheet from "./BaseActionSheet";
import BaseAppPage from "./BaseAppPage";
import BaseBottomToolBar from "./BaseBottomToolBar";
import BaseCard from "./BaseCard";
import BasePopUp from "./BasePopUp";
import BaseProgressBar from "./BaseProgressBar";
import BaseSlider from "./BaseSlider";
import BaseToggle from "./BaseToggle";

// Native Base components style & props default overriding
const Button = {
  baseStyle: {
    minW: "2",
    minH: "2",
  },
  defaultProps: {
    bg: "primary.500",
    rounded: "lg",
  },
};

export default {
  BaseCard,
  BaseActionSheet,
  BaseBottomToolBar,
  BaseToggle,
  BaseSlider,
  BaseAppPage,
  BaseProgressBar,
  BasePopUp,
  Button,
};

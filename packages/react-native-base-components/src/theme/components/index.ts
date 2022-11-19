import ActionSheet from "./ActionSheet";
import AppPage from "./AppPage";
import BottomToolBar from "./BottomToolBar";
import Card from "./Card";
import PopUp from "./PopUp";
import ProgressBar from "./ProgressBar";
import Slider from "./Slider";
import Toggle from "./Toggle";

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
  Card,
  ActionSheet,
  BottomToolBar,
  Toggle,
  Slider,
  AppPage,
  ProgressBar,
  PopUp,
  Button,
};

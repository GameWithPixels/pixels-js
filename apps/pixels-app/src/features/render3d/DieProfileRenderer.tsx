import { EditDataSet } from "@systemic-games/pixels-edit-animation";
import { useMemo } from "react";

import DieRenderer from "./DieRenderer";

/**
 * Props for {@link DieProfileRenderer}.
 */
interface DieProfileRendererProps {
  dataSet: EditDataSet;
}

/**
 * Component that renders a D20 in 3D playing the first animation of the given profile.
 * See {@link DieProfileRendererProps} for the supported props.
 */
export default function ({ dataSet }: DieProfileRendererProps) {
  const animData = useMemo(() => {
    if (dataSet.animations.length) {
      return dataSet.toDataSet();
    }
  }, [dataSet]);
  return <DieRenderer animationData={animData} />;
}

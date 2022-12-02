import { useCallback, useEffect, useState } from "react";

export default function (ms: number): [boolean, () => void] {
  const [hasElapsed, setHasElapsed] = useState(false);
  useEffect(() => {
    if (!hasElapsed) {
      const timeoutId = setTimeout(() => setHasElapsed(true), ms);
      return () => clearTimeout(timeoutId);
    }
  }, [hasElapsed, ms]);
  return [hasElapsed, useCallback(() => setHasElapsed(false), [])];
}

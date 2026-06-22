import { useEffect, useState } from 'react';

export function useSimulatedLoading(delayMs = 900): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return isLoading;
}

export default useSimulatedLoading;

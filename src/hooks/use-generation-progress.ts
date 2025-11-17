import { useCallback, useEffect, useRef, useState } from 'react';

export function useGenerationProgress() {
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetProgress = useCallback(() => {
    clearIntervalRef();
    setProgressValue((prev) => (prev === 0 ? prev : 0));
    setProgressMessage((prev) => (prev === '' ? prev : ''));
  }, [clearIntervalRef]);

  const startProgress = useCallback(
    (message: string) => {
      resetProgress();
      setProgressValue(5);
      setProgressMessage(message);
      intervalRef.current = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 90) {
            return prev;
          }
          const increment = Math.random() * 5 + 1;
          return Math.min(prev + increment, 90);
        });
      }, 1500);
    },
    [resetProgress]
  );

  const advanceProgress = useCallback((value: number, message?: string) => {
    setProgressValue((prev) => Math.max(prev, value));
    if (message) {
      setProgressMessage(message);
    }
  }, []);

  const completeProgress = useCallback(
    (message?: string) => {
      clearIntervalRef();
      setProgressValue(100);
      if (message) {
        setProgressMessage(message);
      }
    },
    [clearIntervalRef]
  );

  const failProgress = useCallback(
    (message?: string) => {
      clearIntervalRef();
      setProgressValue((prev) => (prev > 0 ? prev : 5));
      setProgressMessage(message ?? 'Generation failed');
    },
    [clearIntervalRef]
  );

  useEffect(() => {
    return () => {
      resetProgress();
    };
  }, [resetProgress]);

  return {
    progressValue,
    progressMessage,
    startProgress,
    advanceProgress,
    completeProgress,
    failProgress,
    resetProgress,
  };
}

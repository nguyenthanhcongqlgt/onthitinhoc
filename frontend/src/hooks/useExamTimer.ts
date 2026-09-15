import { useState, useEffect, useRef } from 'react';

interface UseExamTimerProps {
  initialMinutes: number;
  startTimeIso: string;
  onTimeUp: () => void;
}

export const useExamTimer = ({ initialMinutes, startTimeIso, onTimeUp }: UseExamTimerProps) => {
  const totalSeconds = initialMinutes * 60;
  
  const calculateRemainingSeconds = (): number => {
    if (!startTimeIso) return totalSeconds;
    const startMs = new Date(startTimeIso).getTime();
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
    const remaining = totalSeconds - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [initialMinutes, startTimeIso]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = remainingSeconds <= 300 && remainingSeconds > 0; // Under 5 mins

  return {
    remainingSeconds,
    formattedTime,
    isUrgent,
    minutes,
    seconds,
  };
};

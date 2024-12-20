import React, { createContext, useContext, useEffect, useRef } from 'react';

interface TimerContextType {
  getCurrentTime: () => number;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const nowRef = useRef(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      nowRef.current = Date.now() / 1000;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value = React.useMemo(() => ({
    getCurrentTime: () => nowRef.current
  }), []);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimeTill(timestamp: number) {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimeTill must be used within TimerProvider');
  
  const [timeLeft, setTimeLeft] = React.useState(() => 
    Math.max(0, Math.floor(timestamp - context.getCurrentTime()))
  );

  React.useEffect(() => {
    if (!timestamp) return;

    const updateTime = () => {
      const newTimeLeft = Math.max(0, Math.floor(timestamp - context.getCurrentTime()));
      if (newTimeLeft !== timeLeft) {
        setTimeLeft(newTimeLeft);
      }
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timestamp, context]);

  return timeLeft;
}

export function useCheckTimeTill(timestamp: number) {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useCheckTimeTill must be used within TimerProvider');
  
  return Math.max(0, Math.floor(timestamp - context.getCurrentTime()));
} 
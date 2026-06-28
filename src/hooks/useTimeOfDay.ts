import { useState, useEffect } from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export const useTimeOfDay = () => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) {
        setTimeOfDay('dawn');
      } else if (hour >= 8 && hour < 17) {
        setTimeOfDay('day');
      } else if (hour >= 17 && hour < 19) {
        setTimeOfDay('dusk');
      } else {
        setTimeOfDay('night');
      }
    };

    checkTime();
    // Check every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
};

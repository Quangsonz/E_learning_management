import React, { useState, useEffect } from 'react';

export const useCountUp = (target: number, duration = 400) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (duration <= 0 || target === 0) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * easeOutCubic));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

export const CountUpValue: React.FC<{
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  locale?: string;
  formatNumber?: boolean;
}> = React.memo(({ target, duration = 400, suffix = '', prefix = '', locale = 'vi-VN', formatNumber = true }) => {
  const value = useCountUp(target, duration);
  const formatted = formatNumber ? value.toLocaleString(locale) : String(value);
  return React.createElement(React.Fragment, null, prefix, formatted, suffix);
});



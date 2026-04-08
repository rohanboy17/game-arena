'use client';

import { useState, useEffect, useMemo } from 'react';

interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

export default function Countdown({ targetDate, onComplete }: CountdownProps) {
  const timeLeft = useMemo(() => {
    const difference = new Date(targetDate).getTime() - Date.now();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  const [, setTick] = useState(0);

  useEffect(() => {
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
      onComplete?.();
      return;
    }
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const format = (n: number, size: number = 2) => n.toString().padStart(size, '0');

  if (timeLeft.days > 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-primary">{timeLeft.days}d</span>
        <span className="text-muted">:</span>
        <span className="font-bold text-primary">{format(timeLeft.hours)}h</span>
        <span className="text-muted">:</span>
        <span className="font-bold text-primary">{format(timeLeft.minutes)}m</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <div className="bg-background border border-border rounded px-2 py-1">
        <span className="font-bold text-primary">{format(timeLeft.hours)}</span>
      </div>
      <span className="text-muted">:</span>
      <div className="bg-background border border-border rounded px-2 py-1">
        <span className="font-bold text-primary">{format(timeLeft.minutes)}</span>
      </div>
      <span className="text-muted">:</span>
      <div className="bg-background border border-border rounded px-2 py-1">
        <span className="font-bold text-accent">{format(timeLeft.seconds)}</span>
      </div>
    </div>
  );
}
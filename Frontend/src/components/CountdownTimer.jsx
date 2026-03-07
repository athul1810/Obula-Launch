import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

// March 7th 2026, 9pm IST (GMT+5:30)
const TARGET = new Date('2026-03-07T21:00:00+05:30');

function useCountdown() {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = TARGET - now;
      if (diff <= 0) {
        setRemaining({ done: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining({ done: false, days, hours, minutes, seconds });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return remaining;
}

function TimeSlot({ value, label }) {
  return (
    <Motion.div
      layout
      className="relative flex flex-col items-center justify-center min-w-[56px] sm:min-w-[72px] py-3 sm:py-4 px-2 sm:px-3 rounded-xl sm:rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(201,169,98,0.12) 0%, rgba(20,18,15,0.9) 50%, rgba(201,169,98,0.06) 100%)',
        border: '1px solid rgba(201,169,98,0.25)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px -4px rgba(201,169,98,0.2), 0 0 40px -10px rgba(212,175,55,0.15)',
      }}
    >
      <span className="font-mono text-2xl sm:text-4xl md:text-5xl font-bold tabular-nums text-white" style={{ textShadow: '0 0 24px rgba(212,175,55,0.6)' }}>
        {value}
      </span>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#C9A962]/80 mt-0.5 sm:mt-1">
        {label}
      </span>
    </Motion.div>
  );
}

export default function CountdownTimer() {
  const r = useCountdown();

  const pad = (n) => String(n).padStart(2, '0');

  // Show loading skeleton until first tick (avoids flash of nothing)
  if (!r) {
    return (
      <div className="w-full flex justify-center mb-8">
        <div className="animate-pulse rounded-2xl h-32 w-64 bg-white/5" />
      </div>
    );
  }

  if (r.done) {
    return (
      <div className="w-full flex justify-center mb-6">
        <span className="text-white/70 text-lg sm:text-xl font-medium">Event ended</span>
      </div>
    );
  }

  const slots = [];
  if (r.days > 0) slots.push({ value: pad(r.days), label: 'days' });
  slots.push({ value: pad(r.hours), label: 'hours' });
  slots.push({ value: pad(r.minutes), label: 'mins' });
  slots.push({ value: pad(r.seconds), label: 'secs' });

  return (
    <div className="w-full flex flex-col items-center justify-center mb-8">
      <Motion.div
        className="relative rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-6 sm:py-8 mb-6"
        style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(15,14,12,0.85) 100%)',
          border: '1px solid rgba(201,169,98,0.2)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 8px 48px -16px rgba(0,0,0,0.6), 0 0 80px -20px rgba(201,169,98,0.12)',
        }}
      >
        <h2
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.15em] mb-4 sm:mb-6 text-center countdown-title-glow"
          style={{
            background: 'linear-gradient(135deg, #FFF9E6 0%, #E8C547 25%, #FFD700 50%, #E5C158 75%, #FFF9E6 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.8)) drop-shadow(0 0 48px rgba(201,169,98,0.4))',
          }}
        >
          To Launch
        </h2>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {slots.map((slot, i) => (
            <Motion.div key={slot.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <TimeSlot value={slot.value} label={slot.label} />
            </Motion.div>
          ))}
        </div>
        <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm font-medium tracking-wider text-white/60">
          Launch on <span className="text-[#C9A962]">7th March 2026</span>, <span className="text-[#C9A962]/90">9pm IST (GMT+5:30)</span>
        </p>
      </Motion.div>
    </div>
  );
}

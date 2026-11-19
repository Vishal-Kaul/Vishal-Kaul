'use client';

import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

export function DateDivider({ now }: { now?: Date }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const d = now ?? new Date();
    setLabel(`Today · ${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [now]);
  return <div className="text-center text-[12px] text-subtle-text">{label}</div>;
}

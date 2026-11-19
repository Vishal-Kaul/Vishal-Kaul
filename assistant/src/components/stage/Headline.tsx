import type { ReactNode } from 'react';

export function renderHeadline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={i++} className="text-brand">
        {m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Headline({ text }: { text: string }) {
  return <>{renderHeadline(text)}</>;
}

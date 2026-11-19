import type { Conversation } from '@/lib/types';

export function StatusAnnouncer({ conv }: { conv: Conversation }) {
  const { status, error } = conv.state;
  let text = '';
  if (status === 'error') text = error ?? '';
  else if (status === 'thinking') text = conv.slow === 'still' ? 'Still thinking' : 'Thinking';
  return (
    <div aria-live="polite" className="sr-only">
      {text}
    </div>
  );
}

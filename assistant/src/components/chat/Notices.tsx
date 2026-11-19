import type { Conversation } from '@/lib/types';

const pill =
  'inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-[14px] font-medium text-ink hover:bg-wash';

export function Notices({ conv }: { conv: Conversation }) {
  const { status, error } = conv.state;
  if (status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-[14px] text-muted">{error}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={pill} onClick={() => conv.retry()}>
            Retry
          </button>
          <button
            type="button"
            className="text-[14px] text-brand-text underline"
            onClick={() => conv.send('Leave a message')}
          >
            Or leave a message for Vishal
          </button>
        </div>
      </div>
    );
  }
  if (conv.slow === 'still') return <p className="text-[14px] text-muted">Still thinking…</p>;
  if (conv.slow === 'long') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[14px] text-muted">This is taking longer than usual.</p>
        <button type="button" className={pill} onClick={() => conv.retry()}>
          Try again
        </button>
      </div>
    );
  }
  return null;
}

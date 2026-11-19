import { ArrowDownIcon } from './icons';

export function NewMessagePill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-1/2 inline-flex h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-medium text-white shadow-card"
    >
      <ArrowDownIcon size={16} />
      New message
    </button>
  );
}

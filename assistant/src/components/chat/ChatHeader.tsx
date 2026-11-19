import { MicIcon } from './icons';
import { TrustBadge } from './TrustBadge';

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-[18px]">
      <TrustBadge />
      <button
        type="button"
        aria-disabled="true"
        title="Voice is coming soon"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-3.5 text-[15px] font-medium text-brand"
      >
        <MicIcon size={16} />
        Voice
      </button>
    </header>
  );
}

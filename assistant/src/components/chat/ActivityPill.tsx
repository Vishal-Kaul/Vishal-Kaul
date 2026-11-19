const PILL =
  'inline-flex items-center gap-2.5 rounded-full bg-brand-tint px-4 py-2 text-[14px] font-semibold text-brand';

/**
 * "Pulling up the … case study" line. With `onClick` (mobile) it becomes a
 * button that reopens the case-study sheet; the look stays the same.
 */
export function ActivityPill({ text, onClick }: { text: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
      {text}
    </>
  );
  return (
    <div data-activity="">
      {onClick ? (
        <button type="button" onClick={onClick} aria-label={`Open: ${text}`} className={`${PILL} text-left`}>
          {content}
        </button>
      ) : (
        <span className={PILL}>{content}</span>
      )}
    </div>
  );
}

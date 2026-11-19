export function ActivityPill({ text }: { text: string }) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-[14px] py-2 text-[14px] font-semibold text-brand">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

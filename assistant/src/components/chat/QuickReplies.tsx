export function QuickReplies({ items, onPick }: { items: string[]; onPick: (item: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="h-11 rounded-full border border-line bg-white px-[18px] text-[15px] font-medium text-ink hover:bg-wash"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

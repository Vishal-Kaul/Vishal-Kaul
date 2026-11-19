export function TypingDots() {
  return (
    <div
      data-testid="typing"
      aria-hidden="true"
      className="inline-flex w-fit items-center gap-1.5 rounded-[18px] border border-line bg-white px-[18px] py-[18px]"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-subtle"
          style={{ animationDuration: '1s', animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

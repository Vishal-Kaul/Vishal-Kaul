const PORTFOLIO = 'https://vishaluxi.framer.website/';
const LINKS = ['Work', 'About', 'Resume'] as const;

/** Desktop top bar. Links use target="_top" so they leave the iframe when embedded. */
export function Nav({ onTalk }: { onTalk: () => void }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between px-10">
      <p className="flex items-baseline">
        <span className="text-[20px] font-bold tracking-[-0.02em] text-ink">Vishal Kaul</span>
        <span className="ml-3 text-[15px] font-medium text-subtle">Senior Product Designer</span>
      </p>
      <nav aria-label="Portfolio" className="flex items-center">
        <ul className="flex items-center gap-8">
          {LINKS.map((name) => (
            <li key={name}>
              <a href={PORTFOLIO} target="_top" className="text-[15px] font-medium tracking-normal text-ink hover:text-brand">
                {name}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onTalk}
          className="ml-8 h-[38px] rounded-full bg-brand px-[18px] text-[14px] font-semibold tracking-normal text-white"
        >
          Talk to my assistant
        </button>
      </nav>
    </header>
  );
}

import { PROJECTS } from '@/lib/projects';
import { Glow } from './Glow';

export function MobileHero() {
  return (
    <section className="relative overflow-hidden rounded-card bg-stage p-6 text-white">
      <Glow />
      <div className="relative">
        <p className="text-[14px] font-semibold text-white/70">Meet the assistant</p>
        <h2 className="mt-3 text-[44px] font-bold leading-[1.05] tracking-[-0.03em]">Ask me about Vishal’s work.</h2>
        <p className="mt-3.5 text-[15px] leading-[22px] text-white/65">
          Real projects, his availability, and a message passed straight to him.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(['turbo-mode', 'fisdom'] as const).map((id) => (
            <div key={id} className="rounded-[16px] bg-stage-tile px-4 pb-[13px] pt-4">
              <p className="text-[26px] font-bold leading-[26px] text-brand-soft">{PROJECTS[id].proof.stat}</p>
              <p className="mt-1 text-[13px] font-medium leading-[17px] text-white/85">{PROJECTS[id].proof.mobileLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

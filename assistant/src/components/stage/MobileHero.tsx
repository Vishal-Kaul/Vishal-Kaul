import { PROJECTS } from '@/lib/projects';
import { Glow } from './Glow';

export function MobileHero() {
  return (
    <section className="relative overflow-hidden rounded-card bg-stage p-6 text-white">
      <Glow />
      <div className="relative">
        <p className="text-[14px] font-semibold text-white/70">Meet the assistant</p>
        <h2 className="mt-3 text-[40px] font-bold leading-[1.02] tracking-[-0.03em]">Ask me about Vishal’s work.</h2>
        <p className="mt-3 text-[16px] text-white/65">
          Real projects, his availability, and a message he’ll answer himself.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {(['turbo-mode', 'fisdom'] as const).map((id) => (
            <div key={id} className="rounded-[16px] bg-stage-tile p-4">
              <p className="text-[26px] font-bold text-brand-soft">{PROJECTS[id].proof.stat}</p>
              <p className="text-[13px] font-medium text-white/85">{PROJECTS[id].proof.mobileLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

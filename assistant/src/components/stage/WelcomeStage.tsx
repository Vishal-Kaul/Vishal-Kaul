import { PROJECTS, PROJECT_ORDER } from '@/lib/projects';
import { Glow } from './Glow';

const CAN = ['Answer questions about his work', 'Suggest times for a call', 'Take a message for him'];
const CANT = ['Commit Vishal to anything', 'Discuss pay or other offers', 'Pretend to be a human'];

export function WelcomeStage({ onAsk }: { onAsk(projectName: string): void }) {
  return (
    <section className="relative flex-1 overflow-hidden rounded-card bg-stage p-10 text-white xl:p-[52px]">
      <Glow />
      <div className="relative">
        <p className="text-[16px] font-semibold text-white/70">Meet the assistant</p>
        <h2 className="mt-5 text-[56px] font-bold leading-[0.98] tracking-[-0.035em] xl:text-[84px] xl:leading-[1.01]">
          Ask me about <br className="hidden lg:block" />
          Vishal’s work.
        </h2>
        <p className="mt-6 max-w-[560px] text-[18px] leading-[1.45] text-white/65 xl:mt-7 xl:text-[20px]">
          I’m his AI assistant. I’ll show you real projects, check when he’s free, and pass your message along.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-3 xl:mt-14 xl:gap-4">
          {PROJECT_ORDER.map((id) => {
            const p = PROJECTS[id];
            return (
              <button
                key={id}
                type="button"
                aria-label={`Ask about ${p.name}`}
                onClick={() => onAsk(p.name)}
                className="flex flex-col rounded-[20px] bg-stage-tile p-4 text-left transition-shadow hover:ring-1 hover:ring-white/10 xl:p-[22px]"
              >
                <span className="block text-[14px] font-semibold text-white/85">{p.name}</span>
                <span className="mt-2 block text-[28px] font-bold leading-[1.1] tracking-tight text-brand-soft xl:mt-[9px] xl:text-[40px]">
                  {p.proof.stat}
                </span>
                <span className="mt-2 block text-[13px] leading-[20px] text-white/85 xl:mt-2.5 xl:text-[14px] xl:leading-[21px]">{p.proof.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-10 flex gap-8 xl:mt-[54px] xl:gap-12">
          <div>
            <h3 className="text-[13px] font-semibold text-brand-soft">I can</h3>
            <ul className="mt-1.5 space-y-1.5">
              {CAN.map((t) => (
                <li key={t} className="text-[15px] font-semibold text-white">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white/70">I can’t</h3>
            <ul className="mt-1.5 space-y-1.5">
              {CANT.map((t) => (
                <li key={t} className="text-[15px] font-medium text-white/60">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

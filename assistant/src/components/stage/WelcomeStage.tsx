import { PROJECTS, PROJECT_ORDER } from '@/lib/projects';
import { Glow } from './Glow';

const CAN = ['Answer questions about his work', 'Suggest times for a call', 'Take a message for him'];
const CANT = ['Commit Vishal to anything', 'Discuss pay or other offers', 'Pretend to be a human'];

export function WelcomeStage({ onAsk }: { onAsk(projectName: string): void }) {
  return (
    <section className="relative h-full overflow-hidden rounded-card bg-stage p-[52px] text-white">
      <Glow />
      <div className="relative">
        <p className="text-[16px] font-semibold text-white/70">Meet the assistant</p>
        <h2 className="mt-5 text-[80px] font-bold leading-[0.98] tracking-[-0.035em]">
          Ask me about <br className="hidden lg:block" />
          Vishal’s work.
        </h2>
        <p className="mt-8 max-w-[560px] text-[20px] leading-[1.45] text-white/65">
          I’m his AI assistant. I’ll show you real projects, check when he’s free, and pass your message along.
        </p>
        <div className="mt-[52px] grid grid-cols-3 gap-4">
          {PROJECT_ORDER.map((id) => {
            const p = PROJECTS[id];
            return (
              <button
                key={id}
                type="button"
                aria-label={`Ask about ${p.name}`}
                onClick={() => onAsk(p.name)}
                className="rounded-[20px] bg-stage-tile p-[22px] text-left transition-shadow hover:ring-1 hover:ring-white/10"
              >
                <span className="block text-[14px] font-semibold text-white/85">{p.name}</span>
                <span className="mt-3 block text-[40px] font-bold leading-tight tracking-tight text-brand-soft">
                  {p.proof.stat}
                </span>
                <span className="mt-2 block text-[14px] leading-[21px] text-white/85">{p.proof.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-12 flex gap-10">
          <div>
            <h3 className="text-[13px] font-semibold text-brand-soft">I can</h3>
            <ul className="mt-2 space-y-1">
              {CAN.map((t) => (
                <li key={t} className="text-[15px] font-semibold text-white">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white/70">I can’t</h3>
            <ul className="mt-2 space-y-1">
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

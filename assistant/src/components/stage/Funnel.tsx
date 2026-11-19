import type { ProjectTab } from '@/lib/types';

type FunnelData = NonNullable<Extract<ProjectTab, { placeholder?: false }>['funnel']>;

export function Funnel({ funnel, variant }: { funnel: FunnelData; variant: 'desktop' | 'sheet' }) {
  const last = funnel.rows[funnel.rows.length - 1];
  if (variant === 'sheet') {
    return (
      <div className="rounded-[20px] bg-white px-5 pb-3 pt-[18px]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[16px] font-semibold leading-[22px] text-ink">{funnel.shortTitle}</h3>
          <span className="text-[13px] font-medium text-subtle">{funnel.shortMeta}</span>
        </div>
        <div className="mt-2.5 h-3 rounded-full bg-wash">
          <div
            role="img"
            aria-label={`${last.label}: ${last.value}`}
            className="h-3 rounded-full bg-brand"
            style={{ width: `${last.fraction * 100}%` }}
          />
        </div>
        <div className="mt-2.5 flex justify-between text-[13px] font-medium text-muted">
          {funnel.rows.map((r) => (
            <span key={r.label}>{r.shortLabel}</span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-[20px] bg-white px-6 py-[22px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-[17px] font-semibold text-ink">{funnel.title}</h3>
        <span className="text-[13px] font-medium text-subtle">{funnel.meta}</span>
      </div>
      <div className="mt-[11px] grid grid-cols-[132px_1fr_88px] items-center gap-x-4 gap-y-[11px] xl:grid-cols-[142px_1fr_100px] xl:gap-x-6">
        {funnel.rows.map((r, i) => (
          <div key={r.label} className="contents">
            <span className="text-[14px] font-medium text-muted">{r.label}</span>
            <div>
              <div
                role="img"
                aria-label={`${r.label}: ${r.value}`}
                className={`h-3 rounded-full ${i === funnel.rows.length - 1 ? 'bg-brand' : 'bg-brand-soft'}`}
                style={{ width: `${r.fraction * 100}%` }}
              />
            </div>
            <span className="text-right text-[13px] font-semibold text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

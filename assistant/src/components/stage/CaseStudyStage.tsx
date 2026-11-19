'use client';

import { useId } from 'react';
import { PROJECTS } from '@/lib/projects';
import type { ProjectId, TabId } from '@/lib/types';
import { Funnel } from './Funnel';
import { renderHeadline } from './Headline';
import { ArrowUpRightIcon } from './icons';
import { Tabs, tabId } from './Tabs';

type Props = {
  project: ProjectId;
  tab: TabId;
  onTab(tab: TabId): void;
  variant: 'desktop' | 'sheet';
  onClose?: () => void;
};

export function CaseStudyStage({ project, tab, onTab, variant, onClose }: Props) {
  const idPrefix = useId();
  const p = PROJECTS[project];
  const content = p.tabs[tab];
  const sheet = variant === 'sheet';

  const link = (
    <a
      href={p.caseStudyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white ${
        sheet ? 'h-[50px] w-full' : 'h-[42px] px-5'
      }`}
    >
      Open full case study
      <ArrowUpRightIcon />
    </a>
  );

  let body;
  let source: string | undefined;
  if (content.placeholder) {
    body = (
      <div>
        <h2 className={`font-bold leading-none tracking-[-0.035em] ${sheet ? 'text-[32px]' : 'text-[48px]'}`}>
          {p.name}
        </h2>
        <p className="mt-4 text-[18px] text-muted">Details coming soon.</p>
        <p className="mt-2 text-[15px] text-subtle-text">I’ll fill this in once Vishal shares the full case study.</p>
      </div>
    );
  } else {
    source = content.source;
    const cards = [
      { c: content.before, dark: false },
      { c: content.after, dark: true },
    ] as const;
    body = (
      <div className={`flex flex-col ${sheet ? 'gap-[18px]' : 'gap-5'}`}>
        <div className={sheet ? 'pb-1' : undefined}>
          <h2
            className={`font-bold tracking-[-0.035em] leading-none ${sheet ? 'text-[36px]' : 'text-[44px] xl:text-[64px]'}`}
          >
            {renderHeadline(content.headline)}
          </h2>
          {!sheet && <p className="mt-4 text-[18px] text-muted">{content.subhead}</p>}
        </div>
        {(content.before || content.after) && (
          <div className="grid grid-cols-2 gap-4">
            {cards.map(({ c, dark }) =>
              c ? (
                <div
                  key={dark ? 'after' : 'before'}
                  className={`rounded-[20px] ${sheet ? 'p-4' : 'p-5 xl:p-6'} ${dark ? 'bg-ink text-white' : 'bg-white'}`}
                >
                  <p className={`text-[13px] font-medium ${dark ? 'text-white/80' : 'text-subtle-text'}`}>
                    {sheet ? c.shortKicker : c.kicker}
                  </p>
                  <p
                    className={`font-bold leading-tight ${sheet ? 'text-[30px]' : 'text-[32px] xl:text-[44px]'} ${
                      dark ? 'text-brand-soft' : 'text-subtle-text'
                    }`}
                  >
                    {c.value}
                  </p>
                  <p className={`text-[15px] ${dark ? 'text-white' : 'text-muted'}`}>
                    {sheet ? c.shortCaption : c.caption}
                  </p>
                </div>
              ) : null,
            )}
          </div>
        )}
        {content.funnel && <Funnel funnel={content.funnel} variant={variant} />}
        {content.takeaway && (
          <div className="border-l-[3px] border-brand pl-4">
            <p className="text-[13px] font-medium text-brand-text">Takeaway</p>
            <p className={`font-semibold text-ink ${sheet ? 'text-[15px] leading-[21px]' : 'text-[17px]'}`}>
              {sheet ? content.takeaway.shortText : content.takeaway.text}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      className={
        sheet
          ? 'bg-wash px-5 pb-6'
          : 'flex flex-1 flex-col rounded-card bg-wash p-7 xl:p-9'
      }
    >
      <div className="flex items-center justify-between gap-4">
        <Tabs value={tab} onChange={onTab} idPrefix={idPrefix} />
        {!sheet && (
          <span className="hidden shrink-0 text-[14px] font-medium text-muted xl:inline">{p.name} · case study</span>
        )}
      </div>
      <div
        id={`${idPrefix}-panel`}
        role="tabpanel"
        aria-labelledby={tabId(idPrefix, tab)}
        className={sheet ? 'mt-5' : 'mt-6'}
      >
        {body}
      </div>
      {sheet ? (
        <div className="mt-9 flex flex-col items-center gap-3">
          {link}
          <button type="button" onClick={onClose} className="h-11 text-[15px] font-semibold text-brand-text">
            Back to chat
          </button>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-[13px] font-medium text-subtle-text">{source}</span>
          {link}
        </div>
      )}
    </section>
  );
}

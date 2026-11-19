import type { Project, ProjectId, TabId } from './types';

// Content is taken only from the Figma file and CLAUDE.md. Tabs without
// designed content stay placeholders until assistant-facts.md arrives.
// TODO(vishal): replace caseStudyUrl with each project's real page path.
const PORTFOLIO = 'https://vishaluxi.framer.website/';

export const TAB_ORDER: TabId[] = ['overview', 'gap', 'results', 'learnings'];
export const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  gap: 'The gap',
  results: 'Results',
  learnings: 'Learnings',
};

export const PROJECTS: Record<ProjectId, Project> = {
  'turbo-mode': {
    id: 'turbo-mode',
    name: 'Turbo Mode',
    proof: { stat: '44%', label: 'of traders who opened it placed an order', mobileLabel: 'ordered in Turbo Mode' },
    defaultTab: 'results',
    caseStudyUrl: PORTFOLIO,
    tabs: {
      overview: { placeholder: true },
      gap: { placeholder: true },
      learnings: { placeholder: true },
      results: {
        headline: 'From 10+ taps to [[2.]]',
        subhead: 'Tap a strike, tap Buy. The order is placed without leaving the chart.',
        before: { kicker: 'Before: the old flow', shortKicker: 'Before', value: '10+ taps', caption: 'across five screens', shortCaption: 'five screens' },
        after: { kicker: 'After: Turbo Mode', shortKicker: 'After', value: '2 taps', caption: 'on one screen', shortCaption: 'one screen' },
        funnel: {
          title: '44% of traders placed an order',
          shortTitle: '44% placed an order',
          meta: '8,352 traders · 3 months',
          shortMeta: '8,352 traders',
          rows: [
            { label: 'Opened Turbo Mode', shortLabel: 'Opened', value: '8,352', fraction: 1 },
            { label: 'Tapped a strike', shortLabel: 'Strike', value: '6,117 · 73%', fraction: 6117 / 8352 },
            { label: 'Tapped Buy', shortLabel: 'Buy', value: '4,849 · 79%', fraction: 4849 / 8352 },
            { label: 'Order confirmed', shortLabel: 'Order', value: '3,683 · 76%', fraction: 3683 / 8352 },
          ],
        },
        takeaway: {
          text: 'Less is faster: removing features made the screen quicker to use.',
          shortText: 'Less is faster: removing features made the screen quicker.',
        },
        source: 'Source: Turbo Mode case study, results',
      },
    },
  },
  'trade-ideas': {
    id: 'trade-ideas',
    name: 'Trade Ideas',
    proof: { stat: '4 prices', label: 'entry, stop loss, target and live, in one glance', mobileLabel: 'in one glance' },
    defaultTab: 'overview',
    caseStudyUrl: PORTFOLIO,
    tabs: { overview: { placeholder: true }, gap: { placeholder: true }, results: { placeholder: true }, learnings: { placeholder: true } },
  },
  fisdom: {
    id: 'fisdom',
    name: 'Fisdom Revamp',
    proof: { stat: '+32%', label: 'conversion after release', mobileLabel: 'Fisdom conversion' },
    defaultTab: 'overview',
    caseStudyUrl: PORTFOLIO,
    tabs: { overview: { placeholder: true }, gap: { placeholder: true }, results: { placeholder: true }, learnings: { placeholder: true } },
  },
};

export const PROJECT_ORDER: ProjectId[] = ['turbo-mode', 'trade-ideas', 'fisdom'];

'use client';

import type { StageState, TabId } from '@/lib/types';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { CaseStudyStage } from './CaseStudyStage';
import styles from './Stage.module.css';
import { WelcomeStage } from './WelcomeStage';

export function Stage({
  stage,
  onTab,
  onAsk,
  variant,
  onClose,
}: {
  stage: StageState;
  onTab(tab: TabId): void;
  onAsk(projectName: string): void;
  variant: 'desktop' | 'sheet';
  onClose?: () => void;
}) {
  const reduced = useReducedMotion();
  const key = stage.view === 'welcome' ? 'welcome' : stage.project;
  const cls = `${styles.root} h-full${reduced ? '' : ' motion-safe:animate-[stageIn_200ms_ease-out]'}`;
  return (
    <div key={key} className={cls} data-reduced={reduced ? 'true' : undefined}>
      {stage.view === 'welcome' ? (
        <WelcomeStage onAsk={onAsk} />
      ) : (
        <CaseStudyStage project={stage.project} tab={stage.tab} onTab={onTab} variant={variant} onClose={onClose} />
      )}
    </div>
  );
}

/**
 * A.U.R.A. — Project phases.
 *
 * Every milestone of the project is frozen as a git tag (`phase-1`,
 * `phase-2`, …) and published, unchanged, at its own address
 * (https://aura-phaseN.sixvectors.app/) with `npm run deploy:phase -- phase-N`.
 * Settings › Project phases lists them so the evolution of the project can
 * be shown phase by phase, instead of being lost under later improvements.
 *
 * CURRENT_PHASE is the phase this build belongs to. When a phase is frozen,
 * this constant is set to it before tagging; work on the next phase then
 * moves it forward.
 */
import type { MessageKey } from '../i18n/i18n.js';

export type PhaseId = 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4' | 'phase-5';

export interface ProjectPhase {
  id: PhaseId;
  number: number;
  /** Frozen build address; undefined while the phase is not published. */
  url?: string;
  /** Freeze date (YYYY-MM-DD); undefined for phases not frozen yet. */
  frozenOn?: string;
  name: MessageKey;
  summary: MessageKey;
}

export const CURRENT_PHASE: PhaseId = 'phase-2';

export const PROJECT_PHASES: readonly ProjectPhase[] = [
  {
    id: 'phase-1',
    number: 1,
    url: 'https://aura-phase1.sixvectors.app/',
    frozenOn: '2026-11-17',
    name: 'phase.1.name',
    summary: 'phase.1.summary',
  },
  {
    id: 'phase-2',
    number: 2,
    url: 'https://aura-phase2.sixvectors.app/',
    frozenOn: '2026-11-17',
    name: 'phase.2.name',
    summary: 'phase.2.summary',
  },
  { id: 'phase-3', number: 3, name: 'phase.3.name', summary: 'phase.3.summary' },
  { id: 'phase-4', number: 4, name: 'phase.4.name', summary: 'phase.4.summary' },
  { id: 'phase-5', number: 5, name: 'phase.5.name', summary: 'phase.5.summary' },
];

/** Where a phase stands relative to this build. */
export function phaseState(phase: ProjectPhase): 'current' | 'released' | 'next' | 'planned' {
  if (phase.id === CURRENT_PHASE) return 'current';
  const current = PROJECT_PHASES.find((p) => p.id === CURRENT_PHASE)?.number ?? 0;
  if (phase.number < current) return 'released';
  return phase.number === current + 1 ? 'next' : 'planned';
}

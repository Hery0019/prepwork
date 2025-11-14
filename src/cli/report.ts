// Rapport lisible d'un plan : compteurs par opération, puis le détail de ce qui demande
// l'attention de l'équipe (modifié, conflit, suppression) et de ce qui est écrit.
import type { Operation, Plan } from '../engine/plan.js';

export interface Reporter {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export function createConsoleReporter(): Reporter {
  return {
    info: (m) => {
      console.log(m);
    },
    warn: (m) => {
      console.warn(m);
    },
    error: (m) => {
      console.error(m);
    },
  };
}

const LABELS: Record<Operation['kind'], string> = {
  create: 'à créer',
  update: 'à mettre à jour',
  unchanged: 'inchangé',
  'skip-modified': "modifié par l'équipe (ignoré)",
  conflict: 'conflit (ignoré)',
  delete: 'à supprimer',
};

/** Vrai quand le plan ne demande aucune écriture et ne signale rien. */
export function isClean(plan: Plan): boolean {
  const s = plan.summary;
  return (
    s.create === 0 &&
    s.update === 0 &&
    s.delete === 0 &&
    s.conflict === 0 &&
    s['skip-modified'] === 0
  );
}

export function reportPlan(
  reporter: Reporter,
  plan: Plan,
  options: { verb: string; executed: boolean },
): void {
  const s = plan.summary;
  reporter.info(
    `${options.verb} : ${s.create} ${LABELS.create}, ${s.update} ${LABELS.update}, ${s.delete} ${LABELS.delete}, ${s.unchanged} ${LABELS.unchanged}, ${s['skip-modified']} ${LABELS['skip-modified']}, ${s.conflict} ${LABELS.conflict}`,
  );
  const detail = (kind: Operation['kind'], log: (m: string) => void): void => {
    for (const op of plan.operations.filter((o) => o.kind === kind)) {
      log(
        `  ${options.executed && (kind === 'create' || kind === 'update' || kind === 'delete') ? '✔' : '•'} ${LABELS[kind]}  ${op.path}${op.reason ? `  (${op.reason})` : ''}`,
      );
    }
  };
  detail('create', reporter.info);
  detail('update', reporter.info);
  detail('delete', reporter.info);
  detail('skip-modified', reporter.warn);
  detail('conflict', reporter.warn);
  if (s['skip-modified'] > 0) {
    reporter.warn(
      "Fichiers modifiés par l'équipe : prepwork ne les touche jamais. Pour reprendre la version générée, supprimer le fichier puis relancer `prepwork sync`.",
    );
  }
  if (s.conflict > 0) {
    reporter.warn(
      'Conflits : ces fichiers existent sans avoir été générés par prepwork. Les déplacer ou les supprimer, puis relancer.',
    );
  }
}

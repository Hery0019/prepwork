// Registre des packs de stack. `stack.target` de `scaffold.yaml` désigne le pack ; son absence
// vaut `spring-boot` (scaffolds écrits avant l'ADR 0007).
import { DEFAULT_STACK_TARGET } from '../config/schema.js';
import { PrepworkError } from '../errors.js';
import { springBootPack } from './spring-boot/index.js';
import type { StackPack } from './types.js';

export const PACKS: readonly StackPack[] = [springBootPack];

export const PACK_IDS: readonly string[] = PACKS.map((p) => p.id);

export function findPack(id: string): StackPack | undefined {
  return PACKS.find((pack) => pack.id === id);
}

export function getPack(id: string = DEFAULT_STACK_TARGET): StackPack {
  const pack = findPack(id);
  if (!pack) {
    throw new PrepworkError(
      'UNKNOWN_STACK',
      `stack \`${id}\` inconnue (disponibles : ${PACK_IDS.join(', ')})`,
    );
  }
  return pack;
}

export type {
  PackContextInput,
  PackPresentation,
  QuestionnaireInput,
  SkillPresentation,
  SkillSections,
  StackPack,
  SummaryRow,
} from './types.js';

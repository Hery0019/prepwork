// Résultat d'un questionnaire, quel que soit le pack : le scaffold validé et les valeurs
// saisies qui n'entrent pas dans `scaffold.yaml` (URL d'issuer OAuth2 → `.env.example`).
import type { BaseScaffold } from '../config/schema.js';
import type { ComposeExtras } from '../engine/context.js';

export interface QuestionnaireResult {
  scaffold: BaseScaffold;
  extras: ComposeExtras;
}

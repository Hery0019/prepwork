// Rendu Eta des templates. Configuration figée : pas d'échappement XML (on génère du Java,
// du YAML, du XML brut), pas de trim automatique (les templates utilisent `-%>` explicitement),
// données sous `it`. Une erreur de template devient une PrepworkError qui nomme le template.
import { Eta } from 'eta';
import { PrepworkError } from '../errors.js';

export interface TemplateEngine {
  render(template: string, data: object, name: string): string;
}

export function createTemplateEngine(): TemplateEngine {
  const eta = new Eta({
    autoEscape: false,
    autoTrim: false,
    useWith: false,
    varName: 'it',
    cache: false,
    debug: false,
  });
  return {
    render(template, data, name) {
      try {
        return eta.renderString(template, data);
      } catch (error) {
        const detail = error instanceof Error ? error.message.split('\n')[0] : String(error);
        throw new PrepworkError('TEMPLATE_ERROR', `template \`${name}\` : ${detail ?? ''}`, {
          cause: error,
        });
      }
    },
  };
}

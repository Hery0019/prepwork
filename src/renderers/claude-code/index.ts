import { SKILL_NAMES } from '../../catalog/schema.js';
import type { Renderer } from '../types.js';
import { renderClaudeMd } from './claude-md.js';
import { buildModel } from './model.js';
import { renderSkill } from './skills.js';

/** Renderer v1 : `CLAUDE.md` + `.claude/skills/<skill>/SKILL.md`. */
export const claudeCodeRenderer: Renderer = {
  id: 'claude-code',
  render(input) {
    const model = buildModel(input);
    return [renderClaudeMd(model), ...SKILL_NAMES.map((name) => renderSkill(model, name))];
  },
};

import type { Renderer } from '../types.js';
import { renderClaudeMd } from './claude-md.js';
import { buildModel } from './model.js';
import { renderSkill } from './skills.js';

/** Renderer v1 : `CLAUDE.md` + `.claude/skills/<skill>/SKILL.md`. Les skills viennent du pack. */
export const claudeCodeRenderer: Renderer = {
  id: 'claude-code',
  render(input) {
    const model = buildModel(input);
    return [renderClaudeMd(model), ...model.skillList.map((skill) => renderSkill(model, skill))];
  },
};

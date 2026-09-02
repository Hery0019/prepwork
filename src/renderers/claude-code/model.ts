// Vue "prête à rendre" de l'entrée : règles résolues dans la langue de la documentation,
// regroupées par skill puis par source. Partagée par CLAUDE.md et les skills.
import type {
  AntiPattern,
  CoreRuleSet,
  Language,
  Option,
  Profile,
  Rule,
  SkillName,
} from '../../catalog/schema.js';
import { BASE_PACKAGE_PLACEHOLDER, SKILL_NAMES } from '../../catalog/schema.js';
import { pickText } from '../../catalog/text.js';
import type { RenderInput } from '../types.js';
import { STRINGS, type Strings } from './i18n.js';

export interface ResolvedRule {
  id: string;
  statement: string;
  rationale: string;
  enforcedBy: string;
  /** Renseigné pour un anti-pattern. */
  instead?: string;
}

export interface SourceGroup {
  kind: 'core' | 'profile' | 'option';
  id: string;
  title: string;
  /** Résumé de l'option ou du profil, absent pour core. */
  summary?: string;
  rules: ResolvedRule[];
  antiPatterns: ResolvedRule[];
}

export interface SkillView {
  name: SkillName;
  groups: SourceGroup[];
}

export interface RenderModel {
  input: RenderInput;
  language: Language;
  strings: Strings;
  skills: Record<SkillName, SkillView>;
  /** Package Java concret substitué au placeholder. */
  basePackage: string;
  basePackagePath: string;
}

function resolveRule(rule: Rule, language: Language): ResolvedRule {
  return {
    id: rule.id,
    statement: pickText(rule.statement, language),
    rationale: pickText(rule.rationale, language),
    enforcedBy: rule.enforced_by,
  };
}

function resolveAntiPattern(ap: AntiPattern, language: Language): ResolvedRule {
  return { ...resolveRule(ap, language), instead: pickText(ap.instead, language) };
}

function emptySkills(): Record<SkillName, SkillView> {
  const skills = {} as Record<SkillName, SkillView>;
  for (const name of SKILL_NAMES) skills[name] = { name, groups: [] };
  return skills;
}

function coreGroups(
  core: readonly CoreRuleSet[],
  language: Language,
  strings: Strings,
): Map<SkillName, SourceGroup> {
  // Plusieurs fichiers core peuvent viser le même skill (workflow + language) : on fusionne.
  const groups = new Map<SkillName, SourceGroup>();
  for (const set of core) {
    const group = groups.get(set.skill) ?? {
      kind: 'core',
      id: 'core',
      title: strings.skill.coreSection,
      rules: [],
      antiPatterns: [],
    };
    group.rules.push(...set.rules.map((r) => resolveRule(r, language)));
    group.antiPatterns.push(...set.anti_patterns.map((a) => resolveAntiPattern(a, language)));
    groups.set(set.skill, group);
  }
  for (const group of groups.values()) {
    group.rules.sort((a, b) => a.id.localeCompare(b.id));
    group.antiPatterns.sort((a, b) => a.id.localeCompare(b.id));
  }
  return groups;
}

function profileGroups(
  profile: Profile,
  language: Language,
  strings: Strings,
): Map<SkillName, SourceGroup> {
  const rulesById = new Map(profile.rules.map((r) => [r.id, r]));
  const antiPatternsById = new Map(profile.anti_patterns.map((a) => [a.id, a]));
  const groups = new Map<SkillName, SourceGroup>();
  for (const name of SKILL_NAMES) {
    const ids = profile.skills[name];
    if (ids.length === 0) continue;
    const group: SourceGroup = {
      kind: 'profile',
      id: profile.meta.id,
      title: strings.skill.profileSection(profile.meta.id),
      summary: pickText(profile.meta.summary, language),
      rules: [],
      antiPatterns: [],
    };
    for (const id of ids) {
      const rule = rulesById.get(id);
      if (rule) group.rules.push(resolveRule(rule, language));
      const ap = antiPatternsById.get(id);
      if (ap) group.antiPatterns.push(resolveAntiPattern(ap, language));
    }
    groups.set(name, group);
  }
  return groups;
}

function optionGroup(option: Option, language: Language, strings: Strings): SourceGroup {
  return {
    kind: 'option',
    id: option.meta.id,
    title: strings.skill.optionSection(option.meta.id),
    summary: pickText(option.meta.summary, language),
    rules: option.rules.map((r) => resolveRule(r, language)),
    antiPatterns: option.anti_patterns.map((a) => resolveAntiPattern(a, language)),
  };
}

export function buildModel(input: RenderInput): RenderModel {
  const language = input.scaffold.language.docs;
  const strings = STRINGS[language];
  const skills = emptySkills();

  const core = coreGroups(input.core, language, strings);
  const profile = profileGroups(input.profile, language, strings);
  for (const name of SKILL_NAMES) {
    const coreGroup = core.get(name);
    if (coreGroup) skills[name].groups.push(coreGroup);
    const profileGroup = profile.get(name);
    if (profileGroup) skills[name].groups.push(profileGroup);
  }
  for (const option of input.options) {
    skills[option.skill].groups.push(optionGroup(option, language, strings));
  }

  const basePackage = input.scaffold.project.base_package;
  return {
    input,
    language,
    strings,
    skills,
    basePackage,
    basePackagePath: basePackage.replace(/\./g, '/'),
  };
}

/** Remplace le placeholder du catalogue par le package concret (forme package ou chemin). */
export function substituteBasePackage(model: RenderModel, value: string): string {
  const replacement = value.includes('/') ? model.basePackagePath : model.basePackage;
  return value.split(BASE_PACKAGE_PLACEHOLDER).join(replacement);
}

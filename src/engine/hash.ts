import { createHash } from 'node:crypto';

/**
 * Empreinte d'un contenu texte, insensible aux fins de ligne : un checkout Windows avec
 * `autocrlf` ne doit pas faire passer un fichier généré pour modifié.
 */
export function hashContent(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n');
  return `sha256:${createHash('sha256').update(normalized, 'utf8').digest('hex')}`;
}

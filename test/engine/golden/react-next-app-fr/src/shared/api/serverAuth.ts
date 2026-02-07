import 'server-only';

// NEXT-014 : un `fetch` lancé depuis le serveur ne porte aucune session. Le navigateur a un
// bocal à cookies, pas le serveur : il faut relire ceux de la requête entrante et les
// retransmettre explicitement. `credentials: 'include'` n'a aucun effet ici.
import { cookies } from 'next/headers';

export async function authHeaders(): Promise<Record<string, string>> {
  let jar;
  try {
    jar = await cookies();
  } catch {
    // Hors d'une requête — test, tâche planifiée, rendu statique — il n'y a pas de session.
    return {};
  }
  const header = jar
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  return header.length > 0 ? { cookie: header } : {};
}

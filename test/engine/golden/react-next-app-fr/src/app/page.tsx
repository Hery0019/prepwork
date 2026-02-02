// La racine renvoie vers la première feature ; aucune logique ne vit ici (NEXT-002).
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/notes');
}

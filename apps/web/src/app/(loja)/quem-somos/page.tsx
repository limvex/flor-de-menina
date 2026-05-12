import { permanentRedirect } from 'next/navigation';

/** Legado: footer antigo apontava para /quem-somos — conteúdo vive em `/p/sobre`. */
export default function QuemSomosRedirectPage() {
  permanentRedirect('/p/sobre');
}

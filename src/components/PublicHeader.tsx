import Link from 'next/link';
import { cn } from '@/lib/cn';

type Section = 'clasificacion' | 'partidos' | 'grupos' | 'goleadores';

const LINKS: { href: string; label: string; key: Section }[] = [
  { href: '/clasificacion', label: 'Clasificación', key: 'clasificacion' },
  { href: '/partidos', label: 'Partidos', key: 'partidos' },
  { href: '/grupos', label: 'Grupos', key: 'grupos' },
  { href: '/goleadores', label: 'Goleadores', key: 'goleadores' },
];

export function PublicHeader({ active }: { active?: Section }) {
  return (
    <header className="border-b border-pitch-800/50 relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="Inicio">
          <TrophyMark />
          <span className="font-display text-trophy-50 text-lg leading-none tracking-wider group-hover:text-trophy-200 transition-colors hidden sm:inline">
            La Porra <span className="text-trophy-300">2026</span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-display uppercase tracking-wider overflow-x-auto">
          {LINKS.map((l) => {
            const isActive = active === l.key;
            return (
              <Link
                key={l.key}
                href={l.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 transition-colors whitespace-nowrap',
                  isActive ? 'text-trophy-300' : 'text-pitch-200 hover:text-trophy-300',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function TrophyMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M8 4h16v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V4z" stroke="#d8932f" strokeWidth="1.5" fill="#173817" />
      <path d="M8 7C5.5 7 4 8.5 4 11s1.5 4 4 4M24 7c2.5 0 4 1.5 4 4s-1.5 4-4 4" stroke="#d8932f" strokeWidth="1.5" />
      <path d="M12 18v4h8v-4" stroke="#d8932f" strokeWidth="1.5" />
      <path d="M10 26h12" stroke="#d8932f" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 22v4M18 22v4" stroke="#d8932f" strokeWidth="1.5" />
    </svg>
  );
}

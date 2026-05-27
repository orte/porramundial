'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { logout } from '@/app/actions/admin';

const NAV: { href: string; label: string }[] = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/partidos', label: 'Partidos' },
  { href: '/admin/grupos', label: 'Grupos' },
  { href: '/admin/eliminatorias', label: 'Eliminatorias' },
  { href: '/admin/goleadores', label: 'Goleadores' },
  { href: '/admin/porras', label: 'Porras' },
  { href: '/admin/config', label: 'Configuración' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (onNavigate?: () => void) => (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'block px-3 py-2 rounded-sm font-display uppercase tracking-wider text-sm transition-colors border-l-2',
              active
                ? 'border-trophy-400 bg-trophy-950/40 text-trophy-100'
                : 'border-transparent text-pitch-200 hover:text-trophy-200 hover:bg-pitch-800/40',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-6 pt-4 border-t border-pitch-800/60 space-y-1">
      <Link
        href="/"
        className="block px-3 py-2 rounded-sm text-sm text-pitch-300 hover:text-trophy-200 transition-colors"
      >
        ← Volver a la web
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="w-full text-left px-3 py-2 rounded-sm text-sm text-pitch-300 hover:text-red-300 transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* ── Desktop ── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-pitch-800/60 bg-pitch-900/40 lg:sticky lg:top-0 lg:h-screen">
        <div className="px-5 py-5 border-b border-pitch-800/60">
          <p className="font-display text-trophy-300 text-xs tracking-widest leading-none">
            Porra Mundial
          </p>
          <p className="font-display text-trophy-50 text-xl tracking-wider leading-none mt-1">
            Admin
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav()}</div>
        <div className="px-3 pb-4">{footer}</div>
      </aside>

      {/* ── Mobile ── */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-pitch-800/60 bg-pitch-950/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-display text-trophy-100 text-lg tracking-wider">
            Porra Mundial · <span className="text-trophy-300">Admin</span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menú"
            className="btn-ghost px-3 py-2 text-sm"
          >
            {open ? 'Cerrar ✕' : 'Menú ☰'}
          </button>
        </div>
        {open && (
          <div className="px-3 pb-4 border-t border-pitch-800/60 pt-3">
            {nav(() => setOpen(false))}
            {footer}
          </div>
        )}
      </header>
    </>
  );
}

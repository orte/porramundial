import Link from 'next/link';
import { getEntriesForAdmin } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { formatMadrid } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Porras · Admin' };

function formatPoints(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.', ',');
}

export default async function AdminPorrasPage() {
  const entries = await getEntriesForAdmin();

  return (
    <div className="px-5 sm:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Porras"
        description={`${entries.length} ${entries.length === 1 ? 'porra creada' : 'porras creadas'}. Pulsa una fila para ver el detalle público.`}
      />

      {entries.length === 0 ? (
        <div className="panini-card p-8 text-center text-pitch-300 text-sm">
          Todavía no hay porras.
        </div>
      ) : (
        <div className="panini-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-pitch-700 text-left">
                <Th>Participante / equipo</Th>
                <Th className="hidden sm:table-cell">Bota de oro</Th>
                <Th className="hidden md:table-cell text-right">Gastado</Th>
                <Th className="hidden md:table-cell">Creada</Th>
                <Th className="text-right">Pts</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-pitch-800 last:border-0 hover:bg-pitch-800/40"
                >
                  <td className="px-4 py-3">
                    <Link href={`/porra/${e.id}`} className="block group">
                      <p className="font-display text-pitch-50 text-base leading-tight group-hover:text-trophy-200 transition-colors">
                        {e.teamName}
                      </p>
                      <p className="text-pitch-300 text-xs">{e.participantName}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-pitch-200 text-sm">
                    {e.goldenBootFlag ?? '⚽'} {e.goldenBootName}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-right font-mono text-pitch-300 text-sm">
                    {e.totalSpent}M€
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-pitch-400 text-xs">
                    {formatMadrid(e.createdAt, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-trophy-100 text-2xl">
                    {formatPoints(e.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 ${className}`}
    >
      {children}
    </th>
  );
}

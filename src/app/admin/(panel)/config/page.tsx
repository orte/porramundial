import { getLockDate } from '@/lib/lock';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfigForm } from '@/components/admin/ConfigForm';
import { formatShort } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configuración · Admin' };

export default async function AdminConfigPage() {
  const lockDate = await getLockDate();
  const isLocked = new Date() >= lockDate;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl">
      <PageHeader
        title="Configuración"
        description="Ajustes globales del torneo."
      />

      <div className="panini-card p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pitch-300">
            Bloqueo actual (horario Madrid)
          </p>
          <p className="font-display text-trophy-100 text-xl mt-1">{formatShort(lockDate)}</p>
        </div>
        <span className={isLocked ? 'tag-accent' : 'tag'}>
          {isLocked ? '🔒 Porras bloqueadas' : 'Porras abiertas'}
        </span>
      </div>

      <ConfigForm lockDateISO={lockDate.toISOString()} />
    </div>
  );
}

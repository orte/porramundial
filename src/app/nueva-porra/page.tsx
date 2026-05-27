import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EntryWizard } from '@/components/EntryWizard';
import { getAllPlayers, getAllTeams } from '@/lib/queries';
import { isLocked } from '@/lib/lock';

export const dynamic = 'force-dynamic';

export default async function NuevaPorraPage() {
  if (await isLocked()) {
    redirect('/?locked=1');
  }

  const [teams, players] = await Promise.all([getAllTeams(), getAllPlayers()]);

  return (
    <main className="relative z-10 min-h-screen">
      {/* Mini header */}
      <header className="border-b border-pitch-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-trophy-300 hover:text-trophy-200 tracking-widest text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
          <p className="font-display tracking-widest text-pitch-300 text-xs">
            Nueva porra
          </p>
        </div>
      </header>

      <EntryWizard teams={teams} players={players} />
    </main>
  );
}

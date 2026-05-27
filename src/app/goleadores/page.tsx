import Link from 'next/link';

export default function GoleadoresPage() {
  return (
    <main className="relative z-10 min-h-screen">
      <header className="border-b border-pitch-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-trophy-300 hover:text-trophy-200 tracking-widest text-sm transition-colors">
            ← Inicio
          </Link>
          <p className="font-display tracking-widest text-pitch-300 text-xs">Goleadores</p>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-trophy-50 text-5xl mb-4">Goleadores</h1>
        <p className="text-pitch-200">Esta vista se construye en la Fase 4.</p>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = { title: 'Admin · Porra Mundial 2026' };

export default function AdminLoginPage() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="text-center mt-6">
          <Link
            href="/"
            className="font-display text-pitch-300 hover:text-trophy-300 tracking-widest text-xs transition-colors"
          >
            ← Volver a la web pública
          </Link>
        </p>
      </div>
    </main>
  );
}

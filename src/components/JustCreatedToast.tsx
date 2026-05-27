'use client';

import { useEffect, useState } from 'react';

export function JustCreatedToast({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed top-6 right-6 z-50 panini-card-accent px-5 py-3 max-w-sm
        animate-[slideIn_0.3s_ease-out]"
      style={{
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <p className="font-display tracking-wide text-trophy-100">{message}</p>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

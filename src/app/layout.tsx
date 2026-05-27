import type { Metadata } from 'next';
import { Bebas_Neue, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FlagPolyfill } from '@/components/FlagPolyfill';

const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Porra Mundial 2026',
  description: '2026ko Munduko Kopako lagun arteko porra',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="eu" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen relative">
        <FlagPolyfill />
        {children}
      </body>
    </html>
  );
}

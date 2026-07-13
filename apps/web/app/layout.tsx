import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { env } from '@ai-commerce/core/src/env';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'AI Commerce Hub',
  description: 'Sistema operacional de IA para e-commerce multicanal',
};

// Check env on app start if running in server
if (typeof window === 'undefined') {
  console.log(`[Web] Starting with env validation... NODE_ENV=${env.NODE_ENV}`);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

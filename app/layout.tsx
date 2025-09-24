import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budbringer',
  description: 'Budbringer leverer en daglig KI-brief til norske mottakere.',
  metadataBase: new URL('https://example.com'),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className="antialiased text-slate-100" suppressHydrationWarning={true}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

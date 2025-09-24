import Link from 'next/link';
import { ReactNode } from 'react';

const links = [
  { href: '/admin', label: 'Oversikt' },
  { href: '/admin/pending', label: 'Godkjenninger' },
  { href: '/admin/recipients', label: 'Mottakere' },
  { href: '/admin/prompts', label: 'Prompter' },
  { href: '/admin/runs', label: 'Kjøringer' }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-950">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 p-6 lg:flex">
        <h2 className="text-lg font-semibold text-slate-900">Budbringer admin</h2>
        <p className="mt-2 text-sm text-slate-500">Administrer abonnenter og konfigurasjon.</p>
        <nav className="mt-6 space-y-2 text-sm font-medium text-slate-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-600">Admin-konsoll</p>
            <h1 className="text-2xl font-semibold text-slate-900">Daglig status</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
              Logg ut
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

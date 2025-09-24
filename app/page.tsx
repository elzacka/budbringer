import Image from 'next/image';
import { SubscribeForm } from '../components/SubscribeForm';

const HIGHLIGHTS = [
  {
    title: 'Kort og nyttig',
    description:
      'Mangfoldige kilder, kuratert og komprimert for norske lesere. Enten du er nysgjerrig nybegynner eller hardbarka nerd.'
  },
  {
    title: 'Forklart enkelt',
    description:
      'Få ting forklart i et språk alle forstår og lenker til mer info hvis du vil gå i dybden'
  },
  {
    title: 'Troverdige kilder',
    description:
      'Redaktørstyrte medier, forskningsmiljøer og seriøse tech-kilder fra inn- og utland gir deg et balansert nyhetsbilde.'
  },
  {
    title: 'Ingen tull med personvernet',
    description:
      'Vi lagrer e-posten din trygt innenfor EU, og du kan melde deg av når som helst.'
  }
];

export default function LandingPage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,182,255,0.28),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(37,99,235,0.22),_transparent_58%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 text-center sm:px-10 lg:px-16">
        <header className="space-y-8">
          <Image
            src="/budbringer-logo.svg"
            alt="Budbringer"
            width={360}
            height={140}
            priority
            className="mx-auto h-28 w-auto"
          />
          <div className="space-y-6">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
              Daglig KI-brief
            </span>
            <h1 className="mx-auto max-w-3xl text-balance text-[2.55rem] font-semibold leading-tight tracking-tight text-slate-50 sm:text-[2.9rem] md:text-[3.1rem]">
              Bli oppdatert på fem minutter
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-200 md:text-xl">
              Budbringer jobber om natta for å samle de viktigste KI-nyhetene, filtrere bort støy og forklare hva det betyr. Du får det rett i innboksen før du kommer på jobb.
            </p>
          </div>
        </header>

        <SubscribeForm />

        <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[rgba(30,41,59,0.45)] p-6 text-left shadow-[0_18px_35px_rgba(15,23,42,0.22)] transition hover:border-sky-200/50 hover:bg-[rgba(59,130,246,0.25)]"
            >
              <h2 className="mb-3 text-lg font-semibold text-slate-50">{item.title}</h2>
              <p className="text-sm leading-relaxed text-slate-200/90">{item.description}</p>
            </div>
          ))}
        </div>

        <footer className="space-y-2 text-sm text-slate-300">
          <p>Sett av fem minutter i morgen tidlig – Budbringer gjør resten.</p>
        </footer>
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#090908] text-stone-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}

        <footer className="mt-12 border-t border-stone-300/10 pt-6">
          <div className="flex flex-col gap-2 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Hollows • Private Band Workspace</p>
            <p>Beta</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-stone-300/15 bg-[#141311] p-6 shadow-2xl shadow-black/25 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,222,179,0.08),transparent_35%)]" />

      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-5 flex w-fit items-center gap-3">
            <span className="h-px w-10 bg-amber-100/40" />

            <p className="text-xs font-medium uppercase tracking-[0.45em] text-amber-100/70">
              {eyebrow}
            </p>

            <span className="h-px w-10 bg-amber-100/40" />
          </div>

          <h1 className="text-4xl font-bold leading-none tracking-tight text-stone-100 md:text-6xl">
            {title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300">
            {description}
          </p>
        </div>

        {children && (
          <div className="flex shrink-0 justify-start md:justify-end">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-300/15 bg-[#141311] p-5 shadow-2xl shadow-black/25">
      <h2 className="mb-5 text-lg font-semibold text-stone-100">{title}</h2>
      {children}
    </section>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-300/15 bg-[#1c1a17] p-5">
      {children}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-stone-300/10 px-3 py-1 text-xs font-semibold text-amber-100/80">
      {children}
    </span>
  );
}
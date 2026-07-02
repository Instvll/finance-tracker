import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#171614] text-stone-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}

        <footer className="mt-12 border-t border-stone-300/20 pt-6">
          <div className="flex flex-col gap-3 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-stone-300">
                Finance Tracker • v1.0 Beta
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Built for simple personal tracking. Avoid storing sensitive
                details.
              </p>
            </div>

            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Manual Preview
            </p>
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
    <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-6 shadow-xl shadow-black/10 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,239,225,0.12),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-100/30 to-transparent" />

      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-5 flex w-fit items-center gap-3">
            <span className="h-px w-8 bg-stone-100/35" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-stone-200/80">
              {eyebrow}
            </p>

            <span className="h-px w-8 bg-stone-100/35" />
          </div>

          <h1 className="text-4xl font-bold leading-none tracking-tight text-[#f5f0e8] md:text-6xl">
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
    <section className="rounded-[1.75rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center gap-3 border-b border-stone-300/15 pb-4">
        <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.22)]" />

        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-300/18 bg-[#2b2925] p-5 shadow-sm shadow-black/10 transition hover:border-stone-100/25 hover:bg-[#302e29]">
      {children}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-stone-100/15 bg-stone-100/8 px-3 py-1 text-xs font-semibold text-stone-100/85">
      {children}
    </span>
  );
}
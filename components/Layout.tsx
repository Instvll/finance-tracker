export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#11100d] px-4 py-6 text-[#f5f0e8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {children}

        <footer className="mt-10 border-t border-[#f5f0e8]/8 pt-4">
          <a
            href="/whats-new"
            aria-label="View what’s new in leftovr v1.3 Beta"
            className="pressable group flex min-w-0 items-center gap-3 rounded-[1rem] px-1 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                  leftovr
                </p>

                <span
                  className="h-3 w-px shrink-0 bg-[#f5f0e8]/12"
                  aria-hidden="true"
                />

                <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
                  v1.3 Beta
                </p>
              </div>

              <p className="mt-0.5 text-xs leading-5 text-stone-500">
                Clearer by Payday
              </p>
            </div>

            <svg
              className="h-4 w-4 shrink-0 text-stone-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </footer>
      </div>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
          {eyebrow}
        </p>

        {action}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] sm:text-5xl">
        {title}
      </h1>

      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
        {description}
      </p>
    </header>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-[#f5f0e8]/10 bg-[#25231e] p-5 shadow-lg shadow-black/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-3 py-1 text-xs font-semibold text-[#f5f0e8] shadow-sm shadow-black/10">
      {children}
    </span>
  );
}
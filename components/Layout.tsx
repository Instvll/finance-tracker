export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#11100d] px-4 py-6 text-[#f5f0e8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {children}

        <footer className="mt-12 border-t border-[#f5f0e8]/10 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                leftovr
              </p>

              <p className="mt-2 max-w-md text-xs leading-5 text-stone-500">
                Simple personal finance tracking.
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
                v1.0 Beta
              </p>

              <a
  href="/whats-new"
  className="mt-2 inline-flex text-xs leading-5 text-stone-500 transition hover:text-[#f5f0e8]"
>
  View what&apos;s new
</a>
            </div>
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
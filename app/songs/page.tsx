import Link from "next/link";
import TopNav from "@/components/TopNav";
import { PageHeader, PageShell, Pill } from "@/components/Layout";
import { songs } from "../../data/bandData";

export default function SongsPage() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="beta"
        title="Songs"
        description="Track every demo, active song, and finished release from one organized catalog."
      />

      <section className="grid gap-5 md:grid-cols-2">
        {songs.map((song) => (
          <Link
            key={song.title}
            href={song.href}
            className="group block rounded-3xl transition hover:-translate-y-1"
          >
            <article className="h-full rounded-3xl border border-stone-300/15 bg-[#141311] p-6 shadow-2xl shadow-black/20 transition group-hover:border-amber-100/25 group-hover:bg-[#1c1a17]">
  <div className="mb-6 flex items-start justify-between gap-4">
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-500">
        Song Workspace
      </p>

      <h2 className="text-3xl font-bold tracking-tight text-stone-100">
        {song.title}
      </h2>

      <p className="mt-2 text-sm text-amber-100/70">{song.status}</p>
    </div>

    <Pill>{song.bpm} BPM</Pill>
  </div>

  <div className="mb-5 grid gap-3 text-sm text-stone-300">
    <InfoRow label="Tuning" value={song.tuning} />
    <InfoRow label="Key" value={song.key} />
    <InfoRow label="Version" value={song.latestVersion} />
  </div>

  <div className="mb-6">
    <p className="mb-1 text-xs uppercase tracking-[0.2em] text-stone-500">
      Next Step
    </p>

    <p className="text-sm leading-6 text-stone-300">{song.nextStep}</p>
  </div>

  <div className="flex items-center justify-between border-t border-stone-300/10 pt-4">
    <span className="text-xs uppercase tracking-[0.25em] text-stone-500">
      Details
    </span>

    <span className="text-sm text-amber-100/70 transition group-hover:text-amber-50">
      View song &rarr;
    </span>
  </div>
</article>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-300/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-200">{value}</span>
    </div>
  );
}
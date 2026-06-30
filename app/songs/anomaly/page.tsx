import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "@/components/Layout";
import {
  songs,
  tasks,
  files,
  anomalyMixNotes,
} from "../../../data/bandData";

const anomaly = songs.find((song) => song.title === "Anomaly");
const anomalyTasks = tasks.filter((task) => task.song === "Anomaly");
const anomalyFiles = files.filter((file) => file.song === "Anomaly");

export default function AnomalyPage() {
  if (!anomaly) {
    return (
      <PageShell>
        <TopNav />

        <Panel title="Song not found">
          <p className="text-sm text-stone-300">
            This song could not be found in bandData.ts.
          </p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Song Workspace"
        title={anomaly.title}
        description="Track this song’s progress, files, mix notes, tasks, and next steps."
      >
        <Link
          href="/songs"
          className="rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
        >
          Back to Songs
        </Link>
      </PageHeader>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <InfoCard label="Status" value={anomaly.status} />
        <InfoCard label="BPM" value={anomaly.bpm} />
        <InfoCard label="Tuning" value={anomaly.tuning} />
      </section>

      <section className="mb-6 rounded-3xl border border-amber-100/15 bg-[#141311] p-6 shadow-2xl shadow-black/25">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-amber-100/70" />

          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            Current Priority
          </p>
        </div>

        <p className="text-xl font-semibold leading-8 text-stone-100">
          {anomaly.nextStep}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Panel title="Files">
            {anomalyFiles.length > 0 ? (
              <div className="space-y-3">
                {anomalyFiles.map((file) => (
                  <Card key={file.name}>
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-stone-100">
                            {file.name}
                          </h3>

                          <Pill>{file.version}</Pill>
                        </div>

                        <p className="text-sm leading-6 text-stone-300">
                          {file.note}
                        </p>
                      </div>

                      {file.link === "#" ? (
                        <span className="w-fit rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-400">
                          Link Coming Later
                        </span>
                      ) : (
                        <a
                          href={file.link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
                        >
                          Open File
                        </a>
                      )}
                    </div>

                    <div className="grid gap-3 border-t border-stone-300/10 pt-4 text-sm md:grid-cols-2">
                      <FileMeta label="Type" value={file.type} />
                      <FileMeta label="Uploaded By" value={file.uploadedBy} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState text="No files have been added for this song yet." />
            )}
          </Panel>

          <Panel title="Mix Notes">
            {anomalyMixNotes.length > 0 ? (
              <div className="space-y-3">
                {anomalyMixNotes.map((note, index) => (
                  <Card key={note}>
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300/15 bg-black/20 text-xs font-semibold text-amber-100/80">
                        {index + 1}
                      </div>

                      <div>
                        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                          Mix Check
                        </p>

                        <p className="text-sm leading-6 text-stone-300">
                          {note}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState text="No mix notes have been added yet." />
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Tasks">
            {anomalyTasks.length > 0 ? (
              <div className="space-y-3">
                {anomalyTasks.map((task) => (
                  <Card key={`${task.person}-${task.task}`}>
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                          Assigned To
                        </p>

                        <p className="mt-2 font-semibold text-stone-100">
                          {task.person}
                        </p>
                      </div>

                      <Pill>{task.status}</Pill>
                    </div>

                    <p className="text-sm leading-6 text-stone-300">
                      {task.task}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState text="No open tasks are currently assigned to this song." />
            )}

            <Link
              href="/tasks"
              className="mt-4 inline-block rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
            >
              View task board
            </Link>
          </Panel>

          <Panel title="Quick Info">
            <div className="space-y-4">
              <QuickInfoRow label="Song" value={anomaly.title} />
              <QuickInfoRow label="Status" value={anomaly.status} />
              <QuickInfoRow label="Key" value={anomaly.key} />
              <QuickInfoRow label="Tuning" value={anomaly.tuning} />
              <QuickInfoRow label="BPM" value={anomaly.bpm} />
              <QuickInfoRow label="Latest" value={anomaly.latestVersion} />
            </div>
          </Panel>

          <Panel title="Practice Export Reminder">
            <p className="text-sm leading-6 text-stone-300">
              When exporting practice tracks, mute the part being practiced and
              export from the very start of the song so everything lines up
              correctly.
            </p>

            <Link
              href="/resources"
              className="mt-4 inline-block rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
            >
              View resources
            </Link>
          </Panel>
        </div>
      </section>
    </PageShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-stone-100">
        {value}
      </p>
    </Card>
  );
}

function FileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>

      <p className="mt-1 text-sm text-stone-300">{value}</p>
    </div>
  );
}

function QuickInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-300/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-200">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300/15 bg-black/10 p-5">
      <p className="text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "@/components/Layout";
import { songs, tasks, files, updates } from "../data/bandData";

const openTaskList = tasks.filter((task) => task.status !== "Done");
const topTasks = openTaskList.slice(0, 3);
const topFiles = files.slice(0, 3);
const recentUpdates = updates.slice(0, 2);

export default function Home() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Beta"
        title="Band Workspace"
        description="Keep track of songs, files, tasks, mix notes, and recording progress in one private place."
      >
        <div className="hidden h-36 w-72 items-center justify-center md:flex">
          <img
            src="/hollows-logo-transparent.png"
            alt="Hollows logo"
            className="max-h-full max-w-full object-contain opacity-95"
          />
        </div>
      </PageHeader>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Panel title="Recent Updates">
            <div className="space-y-3">
              {recentUpdates.map((update) => (
                <UpdateCard key={update.title} update={update} />
              ))}
            </div>
          </Panel>

          <Panel title="Songs">
            <div className="grid gap-4 md:grid-cols-2">
              {songs.map((song) => (
                <Link
                  key={song.title}
                  href={song.href}
                  className="group block rounded-2xl transition hover:-translate-y-1"
                >
                  <div className="h-full rounded-2xl border border-stone-300/15 bg-[#1c1a17] p-5 transition group-hover:border-amber-100/25 group-hover:bg-[#211f1b]">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-stone-100">
                          {song.title}
                        </h3>

                        <p className="mt-1 text-sm text-amber-100/70">
                          {song.status}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-stone-300/10 px-3 py-1 text-xs font-medium text-amber-100/80">
                        {song.bpm} BPM
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-stone-300">
                      <p>
                        <span className="text-stone-500">Tuning:</span>{" "}
                        <span className="text-stone-200">{song.tuning}</span>
                      </p>

                      <p>
                        <span className="text-stone-500">Next:</span>{" "}
                        {song.nextStep}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-stone-300/10 pt-4">
                      <span className="text-sm text-amber-100/70 transition group-hover:text-amber-50">
                        Open workspace →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Tasks">
            <div className="space-y-3">
              {topTasks.map((task) => (
                <TaskPreview key={`${task.person}-${task.task}`} task={task} />
              ))}
            </div>

            <Link
              href="/tasks"
              className="mt-4 inline-block rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
            >
              View all tasks
            </Link>
          </Panel>

          <Panel title="Files">
            <div className="space-y-3">
              {topFiles.map((file) => (
                <Card key={file.name}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-100">{file.name}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {file.song} • {file.type}
                      </p>
                    </div>

                    <Pill>{file.version}</Pill>
                  </div>
                </Card>
              ))}
            </div>

            <Link
              href="/files"
              className="mt-4 inline-block rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
            >
              View all files
            </Link>
          </Panel>

          <Panel title="Notes">
            <p className="text-sm leading-6 text-stone-300">
              Keep mix notes, artwork concepts, reminders, and rough ideas here
              so nothing gets lost between sessions.
            </p>

            <Link
              href="/notes"
              className="mt-4 inline-block rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50"
            >
              View notes
            </Link>
          </Panel>
        </div>
      </section>
    </PageShell>
  );
}

function UpdateCard({
  update,
}: {
  update: {
    title: string;
    category: string;
    date: string;
    text: string;
  };
}) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-stone-100">{update.title}</h3>

          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
            {update.date}
          </p>
        </div>

        <Pill>{update.category}</Pill>
      </div>

      <p className="text-sm leading-6 text-stone-300">{update.text}</p>
    </Card>
  );
}

function TaskPreview({
  task,
}: {
  task: {
    person: string;
    task: string;
    song: string;
    status: string;
  };
}) {
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {task.song}
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            <span className="font-medium text-stone-100">{task.person}:</span>{" "}
            {task.task}
          </p>
        </div>

        <Pill>{task.status}</Pill>
      </div>
    </Card>
  );
}
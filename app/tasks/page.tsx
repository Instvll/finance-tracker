import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "@/components/Layout";
import { tasks } from "../../data/bandData";

type Task = {
  person: string;
  task: string;
  song: string;
  status: string;
  priority?: string;
  dueDate?: string;
};

const taskList = tasks as Task[];

const statusColumns = [
  {
    status: "To Do",
    description: "Ready to be handled.",
  },
  {
    status: "In Progress",
    description: "Currently being worked on.",
  },
  {
    status: "Done",
    description: "Finished and cleared.",
  },
];

export default function TasksPage() {
  const totalTasks = taskList.length;
  const openTasks = taskList.filter((task) => task.status !== "Done").length;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="beta"
        title="Tasks"
        description="Keep track of who needs to record, export, review, or finish each part."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <OverviewCard
          label="Open Tasks"
          value={String(openTasks)}
          description="Tasks that still need attention"
        />

        <OverviewCard
          label="Total Tasks"
          value={String(totalTasks)}
          description="Everything currently on the board"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {statusColumns.map((column) => {
          const matchingTasks = taskList.filter(
            (task) => task.status === column.status
          );

          return (
            <Panel key={column.status} title={column.status}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <p className="text-sm leading-6 text-stone-300">
                  {column.description}
                </p>

                <Pill>{matchingTasks.length}</Pill>
              </div>

              <div className="space-y-3">
                {matchingTasks.length > 0 ? (
                  matchingTasks.map((task) => (
                    <TaskCard key={`${task.person}-${task.task}`} task={task} />
                  ))
                ) : (
                  <EmptyColumn status={column.status} />
                )}
              </div>
            </Panel>
          );
        })}
      </section>
    </PageShell>
  );
}

function OverviewCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-300/15 bg-[#141311] p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-stone-400">{label}</p>
        <span className="h-2 w-2 rounded-full bg-amber-100/60" />
      </div>

      <p className="text-4xl font-bold tracking-tight text-stone-100">
        {value}
      </p>

      <p className="mt-2 text-sm text-stone-400">{description}</p>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            {task.song}
          </p>

          <h3 className="mt-2 text-lg font-semibold leading-6 text-stone-100">
            {task.task}
          </h3>
        </div>

        <StatusBadge status={task.status} />
      </div>

      <div className="grid gap-3 border-t border-stone-300/10 pt-4 text-sm">
        <TaskMeta label="Assigned To" value={task.person} />
        <TaskMeta label="Priority" value={task.priority || "Normal"} />
        <TaskMeta label="Due Date" value={task.dueDate || "TBD"} />
      </div>
    </Card>
  );
}

function TaskMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-200">{value}</span>
    </div>
  );
}

function EmptyColumn({ status }: { status: string }) {
  let message = "No tasks here yet.";

  if (status === "To Do") {
    message = "Nothing waiting right now.";
  }

  if (status === "In Progress") {
    message = "No one is actively working on a task yet.";
  }

  if (status === "Done") {
    message = "Finished tasks will show up here.";
  }

  return (
    <div className="rounded-2xl border border-dashed border-stone-300/15 bg-black/10 p-5">
      <p className="text-sm leading-6 text-stone-400">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Done") {
    return (
      <span className="rounded-full border border-stone-300/15 bg-stone-300/10 px-3 py-1 text-xs text-stone-300">
        Done
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <span className="rounded-full border border-amber-100/20 bg-amber-100/10 px-3 py-1 text-xs text-amber-100/80">
        In Progress
      </span>
    );
  }

  return (
    <span className="rounded-full border border-stone-300/15 bg-black/20 px-3 py-1 text-xs text-stone-300">
      To Do
    </span>
  );
}
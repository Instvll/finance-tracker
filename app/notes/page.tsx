import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "@/components/Layout";
import { notes } from "../../data/bandData";

export default function NotesPage() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="beta"
        title="Notes"
        description="Keep mix notes, artwork ideas, practice reminders, and rough thoughts organized in one place."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {notes.map((note) => (
          <Card key={note.title}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-500">
                  Band Note
                </p>

                <h2 className="text-xl font-semibold tracking-tight text-stone-100">
                  {note.title}
                </h2>
              </div>

              <Pill>{note.category}</Pill>
            </div>

            <p className="text-sm leading-6 text-stone-300">{note.text}</p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
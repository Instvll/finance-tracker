"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "../../components/Layout";
import { notes } from "../../data/bandData";

type ManualNote = {
  title: string;
  category: string;
  text: string;
};

const notesStorageKey = "finance-tracker-manual-notes";
const notesLastSavedStorageKey = "finance-tracker-notes-last-saved";

const defaultNotes: ManualNote[] = notes.map((note) => ({
  title: note.title,
  category: note.category,
  text: note.text,
}));

function formatSavedTime(value: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function NotesPage() {
  const [manualNotes, setManualNotes] = useState<ManualNote[]>(defaultNotes);
  const [savedMessage, setSavedMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    const savedNotes = window.localStorage.getItem(notesStorageKey);
    const savedTime = window.localStorage.getItem(notesLastSavedStorageKey);

    if (savedNotes) {
      setManualNotes(JSON.parse(savedNotes));
    }

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }, []);

  function markUnsaved() {
    setSavedMessage("");
  }

  function updateNote(index: number, field: keyof ManualNote, value: string) {
    setManualNotes((currentNotes) =>
      currentNotes.map((note, noteIndex) =>
        noteIndex === index
          ? {
              ...note,
              [field]: value,
            }
          : note
      )
    );

    markUnsaved();
  }

  function addNote() {
    setManualNotes((currentNotes) => [
      {
        title: "New Note",
        category: "General",
        text: "",
      },
      ...currentNotes,
    ]);

    markUnsaved();
  }

  function removeNote(index: number) {
    const confirmed = window.confirm("Delete this note?");

    if (!confirmed) {
      return;
    }

    setManualNotes((currentNotes) =>
      currentNotes.filter((_, noteIndex) => noteIndex !== index)
    );

    markUnsaved();
  }

  function saveNotes() {
    const savedAt = new Date().toISOString();

    window.localStorage.setItem(notesStorageKey, JSON.stringify(manualNotes));
    window.localStorage.setItem(notesLastSavedStorageKey, savedAt);

    setLastSaved(savedAt);
    setSavedMessage("Notes saved.");
  }

  function resetNotes() {
    const confirmed = window.confirm(
      "Reset notes back to the default starter notes?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(notesStorageKey);
    window.localStorage.removeItem(notesLastSavedStorageKey);

    setManualNotes(defaultNotes);
    setLastSaved("");
    setSavedMessage("Notes reset.");
  }

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Notes"
        title="Money Notes"
        description="Write quick reminders, budget thoughts, payment notes, or anything you want to remember later."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
            Total Notes
          </p>

          <p className="mt-2 text-3xl font-bold text-[#f5f0e8]">
            {manualNotes.length}
          </p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
            Last Saved
          </p>

          <p className="mt-2 text-xl font-bold text-[#f5f0e8]">
            {formatSavedTime(lastSaved)}
          </p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
            Status
          </p>

          <p className="mt-2 text-xl font-bold text-[#f5f0e8]">
            {savedMessage || "Ready"}
          </p>
        </Card>
      </section>

      <section className="pb-28">
        <Panel title="Editable Notes">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#f5f0e8]">
                Your Notes
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-400">
                Notes are saved on this device for now. Use them for reminders,
                payment plans, spending thoughts, or quick financial decisions.
              </p>
            </div>

            <button
              type="button"
              onClick={addNote}
              className="w-full rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15 sm:w-fit"
            >
              Add Note
            </button>
          </div>

          <div className="space-y-4">
            {manualNotes.length > 0 ? (
              manualNotes.map((note, index) => (
                <Card key={`${note.title}-${index}`}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3">
                        <Pill>{note.category || "General"}</Pill>
                      </div>

                      <h3 className="text-xl font-semibold text-[#f5f0e8]">
                        {note.title || "Untitled Note"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeNote(index)}
                      className="rounded-full border border-stone-300/20 px-3 py-1 text-xs text-stone-400 transition hover:border-red-300/30 hover:bg-red-300/10 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <InputField
                      label="Title"
                      value={note.title}
                      type="text"
                      onChange={(value) => updateNote(index, "title", value)}
                    />

                    <InputField
                      label="Category"
                      value={note.category}
                      type="text"
                      onChange={(value) =>
                        updateNote(index, "category", value)
                      }
                    />

                    <TextAreaField
                      label="Note"
                      value={note.text}
                      onChange={(value) => updateNote(index, "text", value)}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-sm leading-6 text-stone-400">
                  No notes yet. Add one when you want to remember something.
                </p>
              </Card>
            )}
          </div>
        </Panel>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300/20 bg-[#171614]/95 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-stone-400">
              {savedMessage || `Last saved: ${formatSavedTime(lastSaved)}`}
            </p>

            <p className="truncate text-sm font-semibold text-[#f5f0e8]">
              {manualNotes.length} notes saved on this device
            </p>
          </div>

          <button
            type="button"
            onClick={resetNotes}
            className="hidden rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 sm:block"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={saveNotes}
            className="rounded-full border border-stone-100/20 bg-stone-100/12 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/18"
          >
            Save
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function InputField({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: "text";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <textarea
        value={value}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg leading-7 text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}
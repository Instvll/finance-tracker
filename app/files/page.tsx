import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "@/components/Layout";
import { files } from "../../data/bandData";

export default function FilesPage() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="beta"
        title="Files"
        description="Keep project zips organized by song."
      />

      <section className="grid gap-4">
        {files.map((file) => (
          <Card key={file.name}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Pill>{file.version}</Pill>

                  <span className="rounded-full bg-stone-300/10 px-3 py-1 text-xs text-stone-300">
                    {file.type}
                  </span>
                </div>

                <h2 className="text-xl font-semibold tracking-tight text-stone-100">
                  {file.name}
                </h2>
              </div>

              <div className="flex flex-col gap-4 lg:min-w-[260px] lg:items-end">
                <div className="text-sm lg:text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Uploaded By
                  </p>

                  <p className="mt-1 font-medium text-stone-200">
                    {file.uploadedBy}
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
                    Open Link
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
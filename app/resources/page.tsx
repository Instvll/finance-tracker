import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "@/components/Layout";
import { resources } from "../../data/bandData";

export default function ResourcesPage() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="beta"
        title="Resources"
        description="A private library of band workflow guides and file-sharing instructions."
      />

      <section className="grid gap-5">
        {resources.map((resource) => (
          <details
            key={resource.title}
            className="group rounded-3xl border border-stone-300/15 bg-[#141311] p-6 shadow-2xl shadow-black/20 transition open:border-amber-100/25 open:bg-[#1c1a17]"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Pill>{resource.category}</Pill>

                  <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Guide
                  </span>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-stone-100">
                  {resource.title}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
                  {resource.description}
                </p>
              </div>

              <span className="mt-1 shrink-0 rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition group-open:border-amber-100/30 group-open:text-amber-100">
                Details
              </span>
            </summary>

            <div className="mt-6 border-t border-stone-300/10 pt-5">
              <Panel title="Steps">
                <div className="space-y-3">
                  {resource.steps.map((step, index) => (
                    <StepCard key={step} number={index + 1} text={step} />
                  ))}
                </div>
              </Panel>

              {resource.examples && (
                <div className="mt-5">
                  <Panel title="Examples">
                    <div className="grid gap-3 md:grid-cols-2">
                      {resource.examples.map((example) => (
                        <Card key={example}>
                          <code className="text-sm text-amber-100/80">
                            {example}
                          </code>
                        </Card>
                      ))}
                    </div>
                  </Panel>
                </div>
              )}
            </div>
          </details>
        ))}
      </section>
    </PageShell>
  );
}

function StepCard({ number, text }: { number: number; text: string }) {
  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300/15 bg-black/20 text-xs font-semibold text-amber-100/80">
          {number}
        </div>

        <p className="text-sm leading-6 text-stone-300">{text}</p>
      </div>
    </Card>
  );
}
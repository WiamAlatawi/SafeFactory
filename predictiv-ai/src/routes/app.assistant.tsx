import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Bot, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KNOWLEDGE } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/assistant")({ component: AssistantPage });

type Msg = { role: "user" | "assistant"; text: string; sources?: string[] };

const SUGGESTED_PROMPTS = [
  "Explain this failure",
  "Repair procedure",
  "Required spare parts",
  "Safety precautions",
  "Maintenance duration",
  "Prevent recurrence",
];

function AssistantPage() {
  const { diagnosis } = usePipeline();
  const article = diagnosis ? KNOWLEDGE[diagnosis.type] : KNOWLEDGE.HDF;

  const initial = useMemo<Msg[]>(
    () => [
      {
        role: "assistant",
        text: diagnosis
          ? `I have retrieved the maintenance knowledge for **${diagnosis.fullName}**. I can help you understand the repair steps, safety requirements, spare parts needed, or how to explain this to your team. What would you like to know?`
          : "I'm your Maintenance Copilot. Ask me about equipment behavior, repair procedures, safety requirements or maintenance best practices — every answer is retrieved from your maintenance knowledge base.",
        sources: diagnosis
          ? article.sources.map((s) => `${s.title} — ${s.ref}`)
          : undefined,
      },
    ],
    [diagnosis, article],
  );

  const [messages, setMessages] = useState<Msg[]>(initial);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setQ("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 800));
    const t = text.toLowerCase();

    let body = article.bestPractices.join(" ");
    if (t.includes("repair") || t.includes("fix") || t.includes("procedure"))
      body = article.repair.join(" ");
    else if (t.includes("safe"))
      body = article.safety.join(" ");
    else if (t.includes("part") || t.includes("spare"))
      body = article.spares.join(", ");
    else if (t.includes("symptom"))
      body = article.symptoms.join(", ");
    else if (t.includes("prevent") || t.includes("recurrence"))
      body = article.preventive.join(" ");
    else if (t.includes("checklist"))
      body = article.checklist.join(", ");
    else if (t.includes("duration") || t.includes("long") || t.includes("time"))
      body = `Estimated inspection duration depends on failure severity. For ${diagnosis?.fullName ?? "this failure type"}, allow ${diagnosis ? `${diagnosis.expectedDowntimeHours} hours` : "4–8 hours"} for full repair and recommissioning. Refer to your maintenance schedule for site-specific planning.`;
    else if (t.includes("explain") || t.includes("failure"))
      body = `${article.cause} ${diagnosis ? `The detected pattern is ${diagnosis.fullName}. Root cause: ${diagnosis.rootCause}` : ""}`;
    else if (t.includes("manager") || t.includes("summar"))
      body = `${diagnosis ? `A ${diagnosis.fullName} has been detected. ` : ""}${article.cause} Recommended actions: ${article.repair.slice(0, 2).join("; ")}.`;

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: body,
        sources: article.sources.map((s) => `${s.title} — ${s.ref}`),
      },
    ]);
    setThinking(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Maintenance Copilot"
        title={
          <>
            Your <span className="text-gradient">maintenance knowledge base</span>
          </>
        }
        description="Answers retrieved from maintenance documentation, safety procedures and equipment knowledge. Every response cites its source."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex h-[520px] flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10">
                      <Bot className="h-4 w-4 text-brand" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-brand text-brand-foreground"
                        : "border border-border/60 bg-background/40 text-foreground"
                    }`}
                  >
                    <div>{m.text}</div>
                    {m.sources && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-2 pl-9 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 animate-pulse text-brand" />
                  Retrieving from knowledge base…
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/8 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                ask(q);
              }}
            >
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask about symptoms, repair steps, safety or spare parts…"
                className="h-11 rounded-full bg-background/40"
              />
              <Button type="submit" className="h-11 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Context panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 text-brand" /> Active knowledge context
          </div>
          <div className="mt-3 text-base font-semibold tracking-tight text-foreground">
            {diagnosis ? diagnosis.fullName : "General maintenance knowledge"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{article.cause}</p>

          <div className="mt-5 space-y-4 text-sm">
            <KbSection title="Symptoms" items={article.symptoms} />
            <KbSection title="Best practices" items={article.bestPractices} />
            <KbSection title="Preventive actions" items={article.preventive} />
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground">
            Every answer is retrieved from your maintenance documentation. Sources are cited in each response. This assistant does not generate answers — it retrieves them.
          </div>
        </div>
      </div>
    </div>
  );
}

function KbSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, k) => (
          <li key={k} className="text-foreground/80">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

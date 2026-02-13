import SpeakButton from "@/components/SpeakButton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Layers3, ShieldCheck, Sparkle } from "lucide-react";

export type AssistantMeta = {
  providerUsed: "gemini" | "groq" | "huggingface";
  sourceDate: string | null;
  extractedDates: string[];
  failoverTried: ("gemini" | "groq" | "huggingface")[];
};

function providerLabel(p: AssistantMeta["providerUsed"]) {
  if (p === "gemini") return "Gemini";
  if (p === "groq") return "Groq (Llama)";
  return "Hugging Face";
}

export default function ChatMessageBubble({
  id,
  role,
  content,
  createdAt,
  assistantMeta,
}: {
  id: number | string;
  role: string;
  content: string;
  createdAt?: Date | string | null;
  assistantMeta?: AssistantMeta;
}) {
  const isAssistant = role !== "user";

  const createdLabel =
    createdAt instanceof Date
      ? createdAt.toLocaleString()
      : typeof createdAt === "string"
        ? createdAt
        : "";

  return (
    <div className={cn("flex w-full gap-3", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "group max-w-[92%] rounded-3xl border p-4 shadow-[var(--shadow-sm)] backdrop-blur",
          "transition-all duration-300",
          isAssistant
            ? "border-primary/20 bg-gradient-to-br from-primary/10 via-card/55 to-card/35 hover:border-primary/28"
            : "border-border/70 bg-gradient-to-br from-secondary/55 to-card/35 hover:border-border",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-9 w-9 place-items-center rounded-2xl border",
                isAssistant
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border/70 bg-background/15 text-foreground/90",
              )}
            >
              {isAssistant ? <Sparkle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="display text-sm font-bold">
                {isAssistant ? "Reti" : "Jij"}
              </div>
              <div className="mono text-[11px] text-muted-foreground">
                {createdLabel ? createdLabel : "—"}
              </div>
            </div>
          </div>

          {isAssistant ? (
            <SpeakButton text={content} testId={`button-speak-${id}`} />
          ) : null}
        </div>

        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95 sm:text-[15px]">
          {content}
        </div>

        {isAssistant && assistantMeta ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="border border-border/70 bg-card/30">
                <Layers3 className="mr-1.5 h-3.5 w-3.5" />
                Provider: <span className="ml-1 font-semibold">{providerLabel(assistantMeta.providerUsed)}</span>
              </Badge>

              <Badge variant="secondary" className="border border-border/70 bg-card/30">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Bron-datum:{" "}
                <span className="ml-1 font-semibold">
                  {assistantMeta.sourceDate ? assistantMeta.sourceDate : "Geen datum gevonden"}
                </span>
              </Badge>

              <Badge variant="outline" className="border border-primary/20 bg-primary/5 text-foreground">
                Failover:{" "}
                <span className="ml-1 mono text-[11px] text-muted-foreground">
                  {assistantMeta.failoverTried?.length ? assistantMeta.failoverTried.join(" → ") : "—"}
                </span>
              </Badge>
            </div>

            <div className="mt-3">
              <div className="mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Gevonden datums
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {(assistantMeta.extractedDates?.length ? assistantMeta.extractedDates : ["Geen datum gevonden"]).map(
                  (d, idx) => (
                    <span
                      key={`${d}-${idx}`}
                      className="mono rounded-xl border border-border/70 bg-card/25 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {d}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

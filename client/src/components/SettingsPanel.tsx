import { useEffect, useMemo, useState } from "react";
import { Save, LockKeyholeOpen, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LlmProviderKey = "gemini" | "groq" | "huggingface";

export type RetiSettings = {
  groqKey: string;
  hfKey: string;
  geminiKey: string;
  llmOrder: LlmProviderKey[];
};

const LS_KEY = "reti.settings.v1";

export function loadRetiSettings(): RetiSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return {
        groqKey: "",
        hfKey: "",
        geminiKey: "",
        llmOrder: ["gemini", "groq", "huggingface"],
      };
    }
    const parsed = JSON.parse(raw) as Partial<RetiSettings>;
    const llmOrder = Array.isArray(parsed.llmOrder) ? parsed.llmOrder : undefined;
    return {
      groqKey: parsed.groqKey ?? "",
      hfKey: parsed.hfKey ?? "",
      geminiKey: parsed.geminiKey ?? "",
      llmOrder:
        llmOrder?.filter((x): x is LlmProviderKey =>
          x === "gemini" || x === "groq" || x === "huggingface",
        ) ?? ["gemini", "groq", "huggingface"],
    };
  } catch {
    return {
      groqKey: "",
      hfKey: "",
      geminiKey: "",
      llmOrder: ["gemini", "groq", "huggingface"],
    };
  }
}

export function saveRetiSettings(settings: RetiSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

function prettyProvider(p: LlmProviderKey) {
  if (p === "gemini") return "Google Gemini";
  if (p === "groq") return "Groq (Llama)";
  return "Hugging Face";
}

export default function SettingsPanel() {
  const { toast } = useToast();
  const initial = useMemo(() => loadRetiSettings(), []);
  const [groqKey, setGroqKey] = useState(initial.groqKey);
  const [hfKey, setHfKey] = useState(initial.hfKey);
  const [geminiKey, setGeminiKey] = useState(initial.geminiKey);

  const [order1, setOrder1] = useState<LlmProviderKey>(initial.llmOrder[0] ?? "gemini");
  const [order2, setOrder2] = useState<LlmProviderKey>(initial.llmOrder[1] ?? "groq");
  const [order3, setOrder3] = useState<LlmProviderKey>(initial.llmOrder[2] ?? "huggingface");

  useEffect(() => {
    // Keep unique order (if duplicates appear from rapid changes)
    const arr: LlmProviderKey[] = [order1, order2, order3];
    const uniq: LlmProviderKey[] = [];
    for (const p of arr) if (!uniq.includes(p)) uniq.push(p);
    const missing = (["gemini", "groq", "huggingface"] as LlmProviderKey[]).filter(
      (p) => !uniq.includes(p),
    );
    const fixed = [...uniq, ...missing].slice(0, 3);
    if (fixed[0] !== order1) setOrder1(fixed[0]);
    if (fixed[1] !== order2) setOrder2(fixed[1]);
    if (fixed[2] !== order3) setOrder3(fixed[2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order1, order2, order3]);

  function onSave() {
    const next: RetiSettings = {
      groqKey: groqKey.trim(),
      hfKey: hfKey.trim(),
      geminiKey: geminiKey.trim(),
      llmOrder: [order1, order2, order3],
    };
    saveRetiSettings(next);
    toast({
      title: "Instellingen opgeslagen",
      description: "Sleutels & failover-volgorde zijn veilig in je browser bewaard.",
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/25 p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary/18 to-accent/12 ring-1 ring-primary/15">
          <LockKeyholeOpen className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="display text-sm font-bold">Key Vault</div>
          <div className="mono text-[11px] text-muted-foreground">localStorage // client-side</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Groq API key</span>
            <span className="mono text-[10px] text-muted-foreground/80">optional</span>
          </div>
          <Input
            data-testid="input-groq-key"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_..."
            className={cn(
              "h-11 rounded-xl border-2 bg-background/20",
              "focus-visible:ring-primary/20",
            )}
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Hugging Face token</span>
            <span className="mono text-[10px] text-muted-foreground/80">optional</span>
          </div>
          <Input
            data-testid="input-hf-key"
            value={hfKey}
            onChange={(e) => setHfKey(e.target.value)}
            placeholder="hf_..."
            className={cn(
              "h-11 rounded-xl border-2 bg-background/20",
              "focus-visible:ring-primary/20",
            )}
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Gemini key (opt.)</span>
            <span className="mono text-[10px] text-muted-foreground/80">rarely needed</span>
          </div>
          <Input
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
            className={cn(
              "h-11 rounded-xl border-2 bg-background/20",
              "focus-visible:ring-primary/20",
            )}
          />
        </label>
      </div>

      <div className="mt-5 h-px w-full soft-divider opacity-70" />

      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Failover order
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-[64px_1fr] items-center gap-3">
            <div className="mono text-xs text-muted-foreground">1st</div>
            <Select value={order1} onValueChange={(v) => setOrder1(v as LlmProviderKey)}>
              <SelectTrigger
                data-testid="select-llm-order"
                className="h-11 rounded-xl border-2 bg-background/15"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["gemini", "groq", "huggingface"] as LlmProviderKey[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {prettyProvider(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[64px_1fr] items-center gap-3">
            <div className="mono text-xs text-muted-foreground">2nd</div>
            <Select value={order2} onValueChange={(v) => setOrder2(v as LlmProviderKey)}>
              <SelectTrigger className="h-11 rounded-xl border-2 bg-background/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["gemini", "groq", "huggingface"] as LlmProviderKey[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {prettyProvider(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[64px_1fr] items-center gap-3">
            <div className="mono text-xs text-muted-foreground">3rd</div>
            <Select value={order3} onValueChange={(v) => setOrder3(v as LlmProviderKey)}>
              <SelectTrigger className="h-11 rounded-xl border-2 bg-background/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["gemini", "groq", "huggingface"] as LlmProviderKey[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {prettyProvider(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            data-testid="button-save-settings"
            onClick={onSave}
            className={cn(
              "mt-1 h-11 w-full rounded-xl font-semibold",
              "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground",
              "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
              "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
            )}
          >
            <Save className="mr-2 h-4 w-4" />
            Opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useGenerateImage } from "@/hooks/use-image-lab";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ImageProvider = "pollinations" | "craiyon" | "huggingface";

function providerLabel(p: ImageProvider) {
  if (p === "pollinations") return "Pollinations.ai";
  if (p === "craiyon") return "Craiyon";
  return "Hugging Face Diffusers";
}

export default function ImageLabPage() {
  const { toast } = useToast();
  const gen = useGenerateImage();

  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<ImageProvider>("pollinations");

  const [last, setLast] = useState<{ imageUrl: string; providerUsed: ImageProvider; prompt: string } | null>(null);

  const subtitle = useMemo(
    () =>
      "Gratis image hub: genereer beelden via Pollinations.ai, Craiyon of Hugging Face Diffusers. Reti labelt altijd het gebruikte programma.",
    [],
  );

  function onGenerate() {
    const p = prompt.trim();
    if (!p) return;

    gen.mutate(
      { prompt: p, provider },
      {
        onSuccess: (resp) => {
          setLast({ imageUrl: resp.imageUrl, providerUsed: resp.providerUsed as ImageProvider, prompt: p });
          toast({
            title: "Image generated",
            description: `Provider: ${providerLabel(resp.providerUsed as ImageProvider)}`,
          });
        },
        onError: (e) => {
          toast({
            title: "Kon geen image genereren",
            description: e.message,
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <AppShell
      title="Image Lab"
      subtitle={subtitle}
      rightSlot={
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/10 px-3 py-2 shadow-[var(--shadow-xs)]">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="mono text-xs text-muted-foreground">/api/image-lab/generate</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[520px_1fr]">
        <Card className="rounded-3xl border border-border/70 bg-background/10 p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-3xl bg-gradient-to-br from-primary/18 to-accent/12 ring-1 ring-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="display text-lg font-extrabold">Prompt Console</div>
              <div className="mono text-[11px] text-muted-foreground">
                Compose → Choose provider → Generate
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Provider</div>
              <Select value={provider} onValueChange={(v) => setProvider(v as ImageProvider)}>
                <SelectTrigger className="h-11 rounded-xl border-2 bg-background/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["pollinations", "craiyon", "huggingface"] as ImageProvider[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {providerLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Prompt</div>
              <Textarea
                data-testid="input-image-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Bijv: a cinematic sci-fi portrait of a transformer commander, ultra-detailed, dark neon cockpit lighting"
                className={cn(
                  "min-h-[140px] resize-none rounded-2xl border-2 bg-background/10",
                  "focus-visible:ring-primary/15 focus-visible:border-primary/35",
                )}
              />
              <div className="mt-2 mono text-[11px] text-muted-foreground">
                Tip: voeg licht, lens, materiaal en sfeer toe voor meer detail.
              </div>
            </div>

            <Button
              data-testid="button-generate-image"
              onClick={onGenerate}
              disabled={gen.isPending || prompt.trim().length === 0}
              className={cn(
                "h-11 w-full rounded-xl font-semibold",
                "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground",
                "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                "disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none",
              )}
            >
              {gen.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            {gen.isError ? (
              <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <div className="font-semibold">Error</div>
                    <div className="text-muted-foreground">{(gen.error as Error).message}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-background/10 p-5 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="display text-lg font-extrabold">Output</div>
              <div className="mono text-[11px] text-muted-foreground">
                Provider label is always shown.
              </div>
            </div>
            {last ? (
              <Badge variant="secondary" className="border border-primary/20 bg-primary/8">
                Used: <span className="ml-1 font-semibold">{providerLabel(last.providerUsed)}</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="border border-border/70 bg-card/25">
                No output yet
              </Badge>
            )}
          </div>

          <div className="mt-5">
            {last ? (
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/20 shadow-[var(--shadow-lg)]">
                <div className="border-b border-border/70 bg-gradient-to-r from-primary/10 to-accent/8 p-4">
                  <div className="mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Prompt
                  </div>
                  <div className="mt-2 text-sm text-foreground/95">{last.prompt}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border border-primary/20 bg-primary/5">
                      providerUsed: <span className="ml-1 mono text-[11px]">{last.providerUsed}</span>
                    </Badge>
                    <Badge variant="outline" className="border border-border/70 bg-card/15">
                      program: <span className="ml-1 font-semibold">{providerLabel(last.providerUsed)}</span>
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <img
                    src={last.imageUrl}
                    alt={`Generated via ${providerLabel(last.providerUsed)}`}
                    className="h-auto w-full rounded-2xl border border-border/70 shadow-[var(--shadow-md)]"
                    loading="lazy"
                  />
                  <div className="mt-3 mono text-[11px] text-muted-foreground">
                    Als een URL niet laadt, probeer een andere provider of voeg detail toe aan je prompt.
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-3xl border border-border/70 bg-card/15 p-10 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 ring-1 ring-primary/15">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="display mt-4 text-xl font-extrabold">Geen generatie</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Voer links een prompt in en klik op Generate.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

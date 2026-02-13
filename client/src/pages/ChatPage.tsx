import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ConversationList from "@/components/ConversationList";
import ChatMessageBubble, { type AssistantMeta } from "@/components/ChatMessageBubble";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConversation, useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-conversations";
import { useSendMessage } from "@/hooks/use-messages";
import { loadRetiSettings, type LlmProviderKey } from "@/components/SettingsPanel";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Send, Terminal, TriangleAlert } from "lucide-react";
import type { Message } from "@shared/schema";

const BOOT_TEXT =
  "Reticuli online. De informatie is veiliggesteld. Hoe kan ik u van dienst zijn?";

function safeDate(x: unknown): Date | null {
  if (x instanceof Date) return x;
  if (typeof x === "string") {
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function guessAssistantMetaFromContent(content: string): AssistantMeta | undefined {
  // No metadata stored in messages table; we keep UI meta from last response in ephemeral state.
  // This function intentionally does nothing; left as a hook point for future persistence.
  void content;
  return undefined;
}

export default function ChatPage() {
  const { toast } = useToast();
  const convs = useConversations();
  const createConv = useCreateConversation();
  const delConv = useDeleteConversation();
  const send = useSendMessage();

  const [activeId, setActiveId] = useState<number | null>(null);
  const active = useConversation(activeId);

  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // ephemeral assistant run metadata keyed by assistantMessageId (or local synthetic key)
  const [metaByMessageId, setMetaByMessageId] = useState<Record<string, AssistantMeta>>({});

  // select first conversation on load
  useEffect(() => {
    if (activeId !== null) return;
    const list = convs.data ?? [];
    if (list.length) setActiveId(list[0]!.id);
  }, [convs.data, activeId]);

  const messages: Message[] = useMemo(() => {
    const m = active.data?.messages ?? [];
    return m;
  }, [active.data]);

  const assistantBootBubble = useMemo(() => {
    // If no messages, show boot bubble.
    if (messages.length > 0) return null;
    return (
      <ChatMessageBubble
        id="boot"
        role="assistant"
        content={BOOT_TEXT}
        createdAt={null}
        assistantMeta={{
          providerUsed: "gemini",
          sourceDate: null,
          extractedDates: [],
          failoverTried: [],
        }}
      />
    );
  }, [messages.length]);

  const title = "Chat Console";
  const subtitle =
    "Multi-provider AI-assistent met failover. Elke reactie toont provider, failover-chain en gevonden datums.";

  function onCreateConversation() {
    createConv.mutate(
      { title: "New chat" },
      {
        onSuccess: (c) => {
          setActiveId(c.id);
          toast({ title: "Nieuwe conversatie", description: `Thread #${c.id} is klaar.` });
        },
        onError: (e) => toast({ title: "Kon niet aanmaken", description: e.message, variant: "destructive" }),
      },
    );
  }

  function onRequestDeleteConversation(id: number) {
    setDeleteTarget(id);
  }

  function onConfirmDelete() {
    if (deleteTarget == null) return;
    delConv.mutate(deleteTarget, {
      onSuccess: () => {
        toast({ title: "Verwijderd", description: "Conversatie is verwijderd." });
        // reselect
        const next = (convs.data ?? []).filter((c) => c.id !== deleteTarget);
        setActiveId(next[0]?.id ?? null);
        setDeleteTarget(null);
      },
      onError: (e) => toast({ title: "Kon niet verwijderen", description: e.message, variant: "destructive" }),
    });
  }

  function onSend() {
    const text = draft.trim();
    if (!text) return;
    if (!activeId) {
      toast({
        title: "Geen conversatie geselecteerd",
        description: "Maak eerst een nieuwe conversatie aan.",
        variant: "destructive",
      });
      return;
    }

    const settings = loadRetiSettings();
    const order = (settings.llmOrder ?? ["gemini", "groq", "huggingface"]) as LlmProviderKey[];

    send.mutate(
      { conversationId: activeId, body: { content: text, providers: order } },
      {
        onSuccess: (resp) => {
          setDraft("");
          const key = resp.assistantMessageId != null ? String(resp.assistantMessageId) : `ephemeral-${Date.now()}`;
          setMetaByMessageId((prev) => ({
            ...prev,
            [key]: {
              providerUsed: resp.providerUsed,
              sourceDate: resp.sourceDate,
              extractedDates: resp.extractedDates,
              failoverTried: resp.failoverTried,
            },
          }));
        },
        onError: (e) => {
          toast({
            title: "Send failed",
            description: e.message,
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      rightSlot={
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/10 px-3 py-2 shadow-[var(--shadow-xs)]">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="mono text-xs text-muted-foreground">/api/conversations/:id/messages</span>
        </div>
      }
    >
      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(o) => (o ? null : setDeleteTarget(null))}
        title="Conversatie verwijderen?"
        description="Dit verwijdert het gesprek en alle berichten permanent."
        confirmText="Verwijderen"
        cancelText="Annuleren"
        destructive
        onConfirm={onConfirmDelete}
        loading={delConv.isPending}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <section>
          {convs.isLoading ? (
            <div className="rounded-3xl border border-border/70 bg-card/20 p-6 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Laden van conversaties...
              </div>
            </div>
          ) : convs.isError ? (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <div className="display text-base font-bold">Error</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {(convs.error as Error).message}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ConversationList
              items={convs.data ?? []}
              activeId={activeId}
              onSelect={(id) => setActiveId(id)}
              onCreate={onCreateConversation}
              onDelete={onRequestDeleteConversation}
              deletingId={delConv.isPending ? deleteTarget : null}
              creating={createConv.isPending}
            />
          )}
        </section>

        <section className="flex min-h-[520px] flex-col rounded-3xl border border-border/70 bg-background/10 shadow-[var(--shadow-md)]">
          <div className="border-b border-border/70 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/18 to-accent/10 ring-1 ring-primary/15">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="display text-base font-extrabold">Reti Channel</div>
                  <div className="mono text-[11px] text-muted-foreground">
                    {activeId ? `thread #${activeId}` : "no thread selected"}
                  </div>
                </div>
              </div>

              <div className="mono text-[11px] text-muted-foreground">
                {active.isFetching ? "syncing..." : "ready"}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-auto p-4 sm:p-5">
            {activeId == null ? (
              <div className="rounded-3xl border border-border/70 bg-card/20 p-8 text-center shadow-[var(--shadow-sm)]">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 ring-1 ring-primary/15">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <div className="display mt-4 text-xl font-extrabold">Selecteer of maak een chat</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Reti is online, maar heeft een thread nodig om te loggen.
                </div>
                <Button
                  onClick={onCreateConversation}
                  className={cn(
                    "mt-5 h-11 rounded-xl font-semibold",
                    "bg-gradient-to-r from-primary to-primary/75 text-primary-foreground",
                    "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                    "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                  )}
                >
                  Create conversation
                </Button>
              </div>
            ) : active.isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Laden van berichten...
              </div>
            ) : active.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                Error: {(active.error as Error).message}
              </div>
            ) : (
              <>
                {assistantBootBubble}
                {messages.map((m) => {
                  const createdAt = safeDate(m.createdAt) ?? m.createdAt ?? null;
                  const meta =
                    m.role === "assistant"
                      ? metaByMessageId[String(m.id)] ?? guessAssistantMetaFromContent(m.content)
                      : undefined;

                  return (
                    <ChatMessageBubble
                      key={m.id}
                      id={m.id}
                      role={m.role}
                      content={m.content}
                      createdAt={createdAt as any}
                      assistantMeta={meta}
                    />
                  );
                })}
              </>
            )}
          </div>

          <div className="border-t border-border/70 p-4 sm:p-5">
            <div className="rounded-3xl border border-border/70 bg-card/15 p-3 shadow-[var(--shadow-sm)]">
              <Textarea
                data-testid="input-chat"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Typ je vraag aan Reti…"
                className={cn(
                  "min-h-[96px] resize-none rounded-2xl border-2 bg-background/10",
                  "focus-visible:ring-primary/15 focus-visible:border-primary/35",
                )}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSend();
                }}
              />

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="mono text-[11px] text-muted-foreground">
                  Ctrl/⌘ + Enter om te verzenden.
                </div>

                <Button
                  data-testid="button-send"
                  onClick={onSend}
                  disabled={send.isPending || draft.trim().length === 0}
                  className={cn(
                    "h-11 rounded-xl font-semibold",
                    "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground",
                    "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                    "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
                    "disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none",
                  )}
                >
                  {send.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Verzenden
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

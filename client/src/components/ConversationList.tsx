import { useMemo, useState } from "react";
import type { Conversation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Search, Trash2 } from "lucide-react";

export default function ConversationList({
  items,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  deletingId,
  creating,
}: {
  items: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  deletingId?: number | null;
  creating?: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((c) => c.title.toLowerCase().includes(query));
  }, [items, q]);

  return (
    <div className="rounded-3xl border border-border/70 bg-background/10 p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/16 to-accent/10 ring-1 ring-primary/15">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="display text-base font-extrabold">Conversations</div>
            <div className="mono text-[11px] text-muted-foreground">{items.length} threads</div>
          </div>
        </div>

        <Button
          onClick={onCreate}
          disabled={creating}
          className={cn(
            "h-11 rounded-xl font-semibold",
            "bg-gradient-to-r from-primary to-primary/75 text-primary-foreground",
            "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
            "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "New"}
        </Button>
      </div>

      <div className="mt-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          type="search"
          className="h-11 rounded-xl border-2 bg-background/15 pl-9 focus-visible:ring-primary/20"
        />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card/20 p-4 text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : null}

        {filtered.map((c) => {
          const active = activeId === c.id;
          const created =
            c.createdAt instanceof Date
              ? c.createdAt
              : typeof c.createdAt === "string"
                ? new Date(c.createdAt)
                : null;

          return (
            <div
              key={c.id}
              data-testid={`list-item-conversation-${c.id}`}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-300",
                "hover:bg-card/25",
                active
                  ? "border-primary/30 bg-primary/8 shadow-[0_0_0_6px_hsl(var(--primary)/0.08)]"
                  : "border-border/70 bg-card/10",
              )}
            >
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "min-w-0 flex-1 text-left focus:outline-none",
                  "rounded-xl focus:ring-4 focus:ring-primary/10",
                )}
                aria-label={`Open conversation ${c.title}`}
              >
                <div className="truncate text-sm font-semibold">{c.title}</div>
                <div className="mono mt-0.5 truncate text-[11px] text-muted-foreground">
                  {created ? created.toLocaleString() : "—"}
                </div>
              </button>

              <Button
                onClick={() => onDelete(c.id)}
                variant="secondary"
                size="icon"
                disabled={deletingId === c.id}
                className={cn(
                  "h-10 w-10 rounded-xl border border-border/70 bg-card/20",
                  "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/25",
                  "transition-all duration-200",
                )}
                title="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

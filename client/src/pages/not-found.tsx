import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell
      title="404 — Not Found"
      subtitle="Deze sector bestaat niet in het Reticuli-netwerk."
    >
      <div className="rounded-3xl border border-border/70 bg-background/10 p-10 shadow-[var(--shadow-md)]">
        <div className="mx-auto grid max-w-xl place-items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 ring-1 ring-primary/15 shadow-[var(--shadow-sm)]">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold">Route verloren</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ga terug naar de hoofdconsole.
          </p>
          <div className="mt-6">
            <Link href="/" className="inline-block">
              <Button className="h-11 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                Terug naar Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

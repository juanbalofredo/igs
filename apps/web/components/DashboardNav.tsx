import Link from "next/link";
import { Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardNav({ username }: { username: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-50">IG Tracker</p>
            <p className="text-xs text-zinc-500">@{username}</p>
          </div>
        </Link>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            Ajustes
          </Link>
        </Button>
      </div>
    </header>
  );
}

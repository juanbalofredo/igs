import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TrackedAccount } from "@/lib/types";
import { formatNumber, formatRelativeDate } from "@/lib/utils";

interface AccountCardProps {
  account: TrackedAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const hasError = Boolean(account.last_sync_error);
  const isPrivateBlocked = account.last_sync_error?.includes("privada");

  return (
    <Card className="group transition hover:border-violet-500/30 hover:bg-white/[0.05]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-zinc-50">@{account.username}</h3>
              {account.is_private && (
                <Badge variant="muted">
                  <Lock className="mr-1 h-3 w-3" />
                  Privada
                </Badge>
              )}
              {hasError && (
                <Badge variant={isPrivateBlocked ? "warning" : "danger"}>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Sin acceso
                </Badge>
              )}
            </div>
            {account.full_name && <p className="mb-3 text-sm text-zinc-400">{account.full_name}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-violet-400" />
                {formatNumber(account.follower_count ?? 0)} seguidores
              </span>
              <span>{formatNumber(account.following_count ?? 0)} seguidos</span>
              {account.recent_changes !== undefined && account.recent_changes > 0 && (
                <Badge variant="success">{account.recent_changes} cambios (7d)</Badge>
              )}
            </div>
            {account.last_synced_at && (
              <p className="mt-3 text-xs text-zinc-500">Último sync: {formatRelativeDate(account.last_synced_at)}</p>
            )}
            {hasError && <p className="mt-2 text-sm text-amber-300">{account.last_sync_error}</p>}
          </div>
          <Link
            href={`/dashboard/${account.username}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition group-hover:border-violet-500/40 group-hover:text-violet-300"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

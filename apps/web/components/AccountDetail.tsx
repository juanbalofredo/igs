"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { FollowChart } from "@/components/FollowChart";
import { PrivateAccountBanner } from "@/components/PrivateAccountBanner";
import { Timeline } from "@/components/Timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AccountSummary } from "@/lib/types";
import { formatNumber, formatRelativeDate } from "@/lib/utils";

export function AccountDetail({ username }: { username: string }) {
  const [data, setData] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/accounts/${username}`);
        const json = await response.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  async function handleRemove() {
    setRemoving(true);
    try {
      await fetch("/api/tracked", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      window.location.href = "/dashboard";
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!data?.account) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-zinc-500">Cuenta no encontrada.</CardContent>
      </Card>
    );
  }

  const { account, snapshots, changes, stats } = data;
  const hasPrivateError = Boolean(account.last_sync_error?.includes("privada"));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-zinc-50">@{account.username}</h1>
          {account.full_name && <p className="mt-1 text-zinc-400">{account.full_name}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {account.is_private && <Badge variant="muted">Privada</Badge>}
            {account.last_synced_at && (
              <Badge variant="muted">Sync: {formatRelativeDate(account.last_synced_at)}</Badge>
            )}
          </div>
        </div>
        <Button variant="destructive" onClick={handleRemove} disabled={removing}>
          {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Dejar de monitorear
        </Button>
      </div>

      {hasPrivateError && (
        <PrivateAccountBanner message={account.last_sync_error || "No tenés acceso a esta cuenta privada."} />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Seguidores" value={formatNumber(account.follower_count ?? snapshots.at(-1)?.follower_count ?? 0)} />
        <MiniStat label="Seguidos" value={formatNumber(account.following_count ?? snapshots.at(-1)?.following_count ?? 0)} />
        <MiniStat label="Empezó a seguir" value={stats.started_following} />
        <MiniStat label="Dejó de seguir" value={stats.stopped_following} />
      </div>

      <FollowChart snapshots={snapshots} />
      <Timeline changes={changes} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
      </CardContent>
    </Card>
  );
}

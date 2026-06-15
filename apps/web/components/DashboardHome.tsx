"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { AddAccountForm } from "@/components/AddAccountForm";
import { AccountCard } from "@/components/AccountCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrackedAccount } from "@/lib/types";

export function DashboardHome() {
  const [accounts, setAccounts] = useState<TrackedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tracked");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const totalChanges = accounts.reduce((sum, account) => sum + (account.recent_changes ?? 0), 0);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Cuentas monitoreadas</h1>
        <p className="mt-2 text-zinc-400">
          Marcá perfiles de Instagram y seguí quién siguen, dejan de seguir y cómo evolucionan sus números.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Agregar cuenta</CardTitle>
          <CardDescription>Al marcar una cuenta se sincronizan seguidores y seguidos al instante.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddAccountForm onAdded={loadAccounts} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Cuentas marcadas" value={accounts.length} />
        <StatCard label="Cambios últimos 7 días" value={totalChanges} />
        <StatCard
          label="Estado"
          value={loading ? "..." : accounts.some((a) => a.last_sync_error) ? "Con alertas" : "Al día"}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Tus cuentas</h2>
          <button
            type="button"
            onClick={loadAccounts}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              Todavía no marcaste ninguna cuenta. Agregá un @usuario arriba para empezar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
      </CardContent>
    </Card>
  );
}

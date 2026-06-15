"use client";

import { Minus, Plus, UserMinus, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimeRangeFilter } from "@/components/TimeRangeFilter";
import { filterChangesByRange, filterChangesBySearch, groupChangesByDate } from "@/lib/filters";
import type { Change, ChangeType, TimeRange } from "@/lib/types";
import { CHANGE_LABELS } from "@/lib/types";
import { cn, formatShortDate } from "@/lib/utils";
import { useMemo, useState } from "react";

const ICONS = {
  plus: Plus,
  minus: Minus,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
};

interface TimelineProps {
  changes: Change[];
}

export function Timeline({ changes }: TimelineProps) {
  const [range, setRange] = useState<TimeRange>("7d");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byRange = filterChangesByRange(changes, range);
    return filterChangesBySearch(byRange, search);
  }, [changes, range, search]);

  const grouped = useMemo(() => groupChangesByDate(filtered), [filtered]);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>Timeline de cambios</CardTitle>
        <TimeRangeFilter value={range} onChange={setRange} />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar @usuario..."
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {dates.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay cambios en el período seleccionado.</p>
        ) : (
          dates.map((date) => (
            <div key={date}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {formatShortDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map((change) => (
                  <TimelineItem key={change.id} change={change} />
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TimelineItem({ change }: { change: Change }) {
  const meta = CHANGE_LABELS[change.change_type as ChangeType];
  const Icon = ICONS[meta.icon];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/5", meta.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200">
          <span className={meta.color}>{meta.label}</span> a{" "}
          <span className="font-medium text-zinc-50">@{change.target_username}</span>
        </p>
      </div>
    </div>
  );
}

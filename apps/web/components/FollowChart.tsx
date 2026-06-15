"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Snapshot } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

interface FollowChartProps {
  snapshots: Snapshot[];
}

export function FollowChart({ snapshots }: FollowChartProps) {
  const data = [...snapshots]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((snapshot) => ({
      date: formatShortDate(snapshot.snapshot_date),
      seguidores: snapshot.follower_count,
      seguidos: snapshot.following_count,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">Todavía no hay datos suficientes para mostrar el gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de seguidores y seguidos</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="seguidores" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="seguidos" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

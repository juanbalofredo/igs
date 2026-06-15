"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddAccountFormProps {
  onAdded: () => void;
}

export function AddAccountForm({ onAdded }: AddAccountFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error_message || "No se pudo agregar la cuenta");
        return;
      }

      setUsername("");
      onAdded();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="@usuario a monitorear"
        required
      />
      <Button type="submit" disabled={loading} className="sm:min-w-[160px]">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Marcar cuenta
      </Button>
      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
    </form>
  );
}

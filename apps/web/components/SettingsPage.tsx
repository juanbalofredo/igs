"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsPageProps {
  username: string;
}

export function SettingsPage({ username }: SettingsPageProps) {
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needs2fa, setNeeds2fa] = useState(false);

  async function handleReconnect(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          verification_code: verificationCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error_code === "two_factor_required") {
          setNeeds2fa(true);
        }
        setError(data.error_message || "No se pudo reconectar");
        return;
      }

      setSuccess("Sesión de Instagram actualizada correctamente");
      setPassword("");
      setVerificationCode("");
      setNeeds2fa(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-50">Ajustes</h1>
        <p className="mt-2 text-zinc-400">Gestioná tu sesión de Instagram conectada.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuenta conectada</CardTitle>
          <CardDescription>Sesión activa como @{username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReconnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña de Instagram</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {needs2fa && (
              <div className="space-y-2">
                <Label htmlFor="code">Código 2FA</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="123456"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reconectar Instagram
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cerrar sesión</CardTitle>
          <CardDescription>Salir de la aplicación en este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

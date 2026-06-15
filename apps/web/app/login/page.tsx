"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Users } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

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
        setErrorCode(data.error_code || null);
        setError(data.error_message || "No se pudo iniciar sesión");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-50">IG Tracker</h1>
          <p className="mt-2 text-zinc-400">Ingresá con tu cuenta de Instagram para empezar.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Tus credenciales se usan solo para autenticarte con Instagram.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario de Instagram</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="@tu_usuario"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {(needs2fa || errorCode === "two_factor_required") && (
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
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {errorCode === "invalid_credentials" && (
                <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Si la contraseña es correcta, revisá la app de Instagram en tu celular por una alerta de
                    seguridad y aprobalo. Luego intentá de nuevo.
                  </p>
                </div>
              )}
              {errorCode === "challenge_required" && (
                <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Instagram bloqueó el intento. Abrí la app en el celular, confirmá que fuiste vos, y volvé a
                    intentar en unos minutos.
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Entrar con Instagram
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
